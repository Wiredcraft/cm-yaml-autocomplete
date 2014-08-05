// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"), require("../../mode/css/css"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror", "../../mode/css/css"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    var WHITESPACE = /\s+/;
    var WORD = /\w+/;

    // global constants that will show up regardless of context
    var CONSTANTS = ['true', 'false'];

    // context specific keywords
    var keywords= {
        'configuration': {},
        'name': {},
        'provider': {
            'image': {},
            'name': {},
            'region': {},
            'size': {}
        },
        'services': {
            'nginx': {},
            'php': {}
        }
    };

    CodeMirror.registerHelper("hint", "yaml", function(cm, opts) {
        var cur = cm.getCursor(),
            curLine = cm.getLine(cur.line),
            token = cm.getTokenAt(cur);

        var start = token.end,
            end = token.end;

        // walk `start` back until whitespace char or end of line
        while (start && WORD.test(curLine.charAt(start - 1))) --start;
        // walk `end` forwards until non-word or end of line
        while (end < curLine.length && WORD.test(curLine.charAt(end))) ++end;

        var word = curLine.slice(start, end);

        var result = [];
        function add(kw) {
            // add if not already in result set
            if (!kw || result.indexOf(kw) !== -1) {
                return;
            }
            result.push(kw);
        }

        // get context of hierarchy

        var contextKeywords = [
            'configuration',
            'name',
            'provider',
            'services'
        ];

        var possibleKeywords = contextKeywords.concat(CONSTANTS);

        for (var i in possibleKeywords) {
            if (possibleKeywords[i].indexOf(word) !== -1) {
                add(possibleKeywords[i]);
            }
        }

        if (result.length) return {
            list: result,
            from: CodeMirror.Pos(cur.line, start),
            to: CodeMirror.Pos(cur.line, end)
        };
    });
});