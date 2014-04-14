#de-heredoc
Transform "heredoc call" to "string literal" in JavaScript source code before minifications.

## Install
```bash
$ npm install de-heredoc
```

## Usage
`heredoc` is a function to make multiline strings in JavaScript, there are already some libraries you can use e.g. [heredoc](https://github.com/jden/heredoc) and [multiline](https://github.com/sindresorhus/multiline).
```bash
$ cat test.js
var heredoc = require("heredoc");
var html = heredoc(function(){/*
    <div id="test">
        <span>foo</span>
        <span>bar</span>
    </div>
*/});
$ node
> var deHeredoc = require("de-heredoc")
> deHeredoc("test.js")
(^C again to quit)
>
$ cat test.js
var html='<div id="test">\n    <span>foo</span>\n    <span>bar</span>\n</div>';
```
## Options
```javascript
deHeredoc(file[, options])
```
`options` has 4 properties, `from` `dependency` `beautify` and `whitespace`.
### from
Control `file`'s type.
#### "file" (default)
`file` is a file path, change this file in place and return `undefined`.
If the value of `from` is "file", then the `file` parameter can be an array.
```javascript
deHeredoc(["a.js", "b.js", "c.js"], {from: "file"})
```
#### "string"
`file` is a string of JS source code, return the new source code.
```javascript
deHeredoc('var foo = heredoc(function(){/*foo*/})',{
    from: "string"
}) // 'var foo="foo";'
```
#### "ast"
`file` is an UglifyJS AST object, return the new AST object.
```javascript
var ast = UglifyJS.parse('var foo = heredoc(function(){/*foo*/})')
var newAst = deHeredoc(ast, {
    from: "ast"
})
newAst.print_to_string() // 'var foo="foo";'
```
### dependency
The `heredoc` library's name. 
#### "heredoc" (default)
```javascript
deHeredoc('var multiline = require("maybesomepath/multiline");' +
          'var foo = multiline(function(){/*foo*/})',{
    from: "string",
    dependency: "multiline"
}) // 'var foo="foo";'
```
###beautify
Beautify output source code or not.
#### false (default)
```javascript
deHeredoc('if(1+1){var foo=heredoc(function(){/*foo*/})}', {
    from: "string",
    beautify: true
}) 
/*
if (1 + 1) {
    var foo = "foo";
}
*/
```
###whitespace
Control whitespaces in output string literals, see [Whitespaces](#whitespaces)
#### "indent" (default), "raw" and "oneline".
```javascript
deHeredoc('var foo=heredoc(function(){/*  foo   */})', {
    from: "string",
    whitespace: "oneline"
}) // 'var foo="foo";'
```
## Whitespaces
You can use parameter name to control whitespaces in output string literals.
### indent
Strip the redundant leading whitespaces, and preserve other indents.
```javascript
var html = heredoc(function(indent){/*
    <div id="test">
        <span>foo</span>
        <span>bar</span>
    </div>
*/});
```
will be transformed to
```javascript
var html='<div id="test">\n    <span>foo</span>\n    <span>bar</span>\n</div>';
```
### raw
Preserve all whitespaces.
```javascript
var html = heredoc(function(raw){/*
    <div id="test">
        <span>foo</span>
        <span>bar</span>
    </div>
*/});
```
will be transformed to
```javascript
var html='    <div id="test">\n        <span>foo</span>\n        <span>bar</span>\n    </div>';
```
### oneline
Remove all leading and trailing whitespaces.
```javascript
var html = heredoc(function(oneline){/*
    <div id="test">
        <span>foo</span>
        <span>bar</span>
    </div>
*/});
```
will be transformed to
```javascript
var html='<div id="test"><span>foo</span><span>bar</span></div>';
```

## License
MIT