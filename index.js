var UglifyJS = require("uglify-js")
var fs = require("fs")

module.exports = function (code, options) {
  options = options || {}
  var from = options.from || "file"
  var dependency = options.dependency || "heredoc"
  var treeTransformer = getTreeTransformer(dependency, options.whitespace)
  
  if(from === "ast") {
    var ast = code
    return ast.transform(treeTransformer)
  }
  else if(from === "file") {
    var files = [].concat(code)
    files.forEach(function(file){
      var code = fs.readFileSync(file, "utf8")
      fs.writeFileSync(file, getNewCode(code), "utf8")
    })
  }else if(from === "string"){
    return getNewCode(code)
  }

  function getNewCode(code) {
    return UglifyJS.parse(code).transform(treeTransformer).print_to_string({
      beautify: options.beautify
    })
  }
}

function getTreeTransformer(dependency, whitespace) {
  return new UglifyJS.TreeTransformer(function (node, descend) {
    if(node.TYPE === "Call" &&
      node.args.length === 1 &&
      node.args[0].TYPE === "Function" &&
      node.args[0].body.length === 0 &&
      node.args[0].end &&
      node.args[0].end.comments_before &&
      node.args[0].end.comments_before.length === 1 &&
      node.args[0].end.comments_before[0].type === "comment2"
    ) {
      var comment = node.args[0].end.comments_before[0].value
      comment = comment.replace(/^\s*?\n|\s*\n$/g, "")
      var arg = node.args[0].argnames[0]
      var argname = arg ? arg.name : whitespace
      if(argname === "raw") {
        comment = comment
      } else if(argname === "oneline") {
        comment = comment.replace(/\s*^\s*|\s*$/mg, "")
      } else {
        var shortest = comment.split("\n").map(function (str) {
          return str.match(/^\s*/)[0].length
        }).sort(function (a, b) {
          return a - b
        })[0]
        comment = comment.replace(RegExp("^.{" + shortest + "}", "mg"), "")
      }
      return new UglifyJS.AST_String({
        value: comment
      })
    }
    if(dependency) {
      if(node.TYPE === "Var") {
        if(node.definitions.length === 1 &&
          isHeredocDefinition(node.definitions[0])) {
          return new UglifyJS.AST_EmptyStatement
        } else {
          node.definitions = node.definitions.filter(function (definition) {
            return !isHeredocDefinition(definition)
          })
        }
      }
    }
    descend(node, this)
    return node

    function isHeredocDefinition(definition) {
      return (definition.name.TYPE === "SymbolVar" &&
        definition.value.TYPE === "Call" &&
        definition.value.expression.name === "require" &&
        definition.value.args.length === 1 &&
        matchDependency(dependency, definition.value.args[0].value)) ||
        (definition.name.TYPE === "SymbolVar" &&
        definition.value.TYPE === "Dot" &&
        definition.value.TYPE === "Call" &&
        definition.value.expression.expression.name === "require" &&
        definition.value.expression.args.length === 1 &&
        matchDependency(dependency, definition.value.args[0].value))
    }

    function matchDependency(dependency, value) {
      return dependency === value ||
        value.indexOf("/" + dependency) + dependency.length === value.length - 1
    }
  })
}