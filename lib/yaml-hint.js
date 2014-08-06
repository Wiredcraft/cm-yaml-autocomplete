
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
    var OBJECT_KEY = /^\s*?(\w+)\s*?:\s*?$/;
    var WORD_OR_COLON = /\w+|:/;

    // global constants that will show up regardless of context
    var CONSTANTS = ['true', 'false', '{}', '[]'];

    // context specific keywords
    var KEYWORDS= {
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
        },
        'test': {
            'test1': {
                'test2': {}
            }
        }
    };

    function rstrip(line) {
        return line.replace(/\s*$/g, '');
    }

    CodeMirror.registerHelper("hint", "yaml", function(cm, opts) {
        var constants = opts.constants || CONSTANTS;
        var keywords = opts.keywords || KEYWORDS;
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
        // @TODO(Shrugs) ask if this is the most efficient place to put these functions
        // esp since they need reference to cm
        function add(kw) {
            // add if not already in result set
            if (!kw || result.indexOf(kw) !== -1) {
                return;
            }
            result.push(kw);
        }

        function walkUp(pos) {
            pos.line --;
            while (!OBJECT_KEY.test(cm.getLine(pos.line))) {
                pos.line --;
            }
            pos.ch = cm.getLine(pos.line);
            return pos;
        }

        function getIndentation(line) {

            if (!line.match(/^\s*?$/)) {
                // only strip if line isn't all whitespace
                line = rstrip(line);
            }

            // walk left from right until whitespace or eol
            var s = line.length;
            while (s && WORD_OR_COLON.test(line.charAt(s - 1))) --s;
            line = line.slice(0, s);
            // change tabs to spaces
            // @TODO(Shrugs) either do something intelligent with the indentation count
            // or remove the tab replacement
            line = line.replace(/\t/g, ' ');
            // return the number of spaces
            return line.length;
        }

        function getKeyFromLine(line) {
            var m = line.match(OBJECT_KEY);
            if (m) {
                return m[1];
            }
        }

        function getHierarchy(pos) {
            var hierarchy = [];
            var thisLine = cm.getLine(pos.line);

            var isHighestContext = !getIndentation(thisLine);
            var isIndentedBlock = pos.ch && getIndentation(thisLine);

            while (pos.ch !== 0 && getIndentation(thisLine)) {
                // while not at beginning of line (highest point in hierarchy)
                // OR we have reached highest hierarchy (no indentation)
                var k = getKeyFromLine(thisLine);
                if (k !== undefined) {
                    hierarchy.push(k);
                }
                pos = walkUp(pos);
                thisLine = cm.getLine(pos.line);
            }


            if (!isHighestContext || isIndentedBlock) {
                // is an indented block, add the above level's key
                hierarchy.push(getKeyFromLine(thisLine));
            }

            return hierarchy;
        }

        if (curLine.match(OBJECT_KEY)) {
            // if we'e on a line with a key
            for (var c in constants) {
                add(constants[c]);
            }
        } else {
            // else, do contextual suggestions

            // get context of hierarchy
            var context = keywords;
            var contextKeywords = [];
            var hierarchy = getHierarchy(CodeMirror.Pos(cur.line, cur.ch)).reverse();

            // walk down contexts
            for (var h in hierarchy) {
                context = context[hierarchy[h]];
            }
            contextKeywords = Object.keys(context);

            for (var i in contextKeywords) {
                var kw = contextKeywords[i];
                if (kw.indexOf(word) !== -1) {
                    if (Object.keys(context[kw]).length) {
                        // if this context has additional contexts below it, it is a key, and add a colon
                        // Ideally, I'd like to have it auto newline as well, but I don't think there's a good way to do that
                        kw += ':';
                    } else {
                        kw += ': ';
                    }
                    add(kw);
                }
            }
        }

        if (result.length) return {
            list: result,
            from: CodeMirror.Pos(cur.line, start),
            to: CodeMirror.Pos(cur.line, end)
        };
    });
});