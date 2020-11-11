// Generated automatically by nearley, version undefined
// http://github.com/Hardmath123/nearley
(function () {
   function id(x) { return x[0]; }
   var grammar = {
       Lexer: undefined,
       ParserRules: [
       {"name": "_$ebnf$1", "symbols": []},
       {"name": "_$ebnf$1", "symbols": ["wschar", "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
       {"name": "__$ebnf$1", "symbols": ["wschar"]},
       {"name": "__$ebnf$1", "symbols": ["wschar", "__$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
       {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
       {"name": "E", "symbols": ["_", "EXPRESSION", "_"], "postprocess": function(d) {return d[1]}},
       {"name": "EXPRESSION", "symbols": ["INOPTION", "__", "OPERATION"], "postprocess": function(d) {return [d[0], d[2]]}},
       {"name": "EXPRESSION", "symbols": ["INOPTION", "__", "DEBUGOPTION", "__", "OPERATION"], "postprocess": function(d) {return [d[0], d[2], d[4]]}},
       {"name": "EXPRESSION", "symbols": ["INOPTION", "__", "OUTOPTION", "__", "OPERATION"], "postprocess": function(d) {return [d[0], d[2], d[4]]}},
       {"name": "EXPRESSION", "symbols": ["INOPTION", "__", "DEBUGOPTION", "__", "OUTOPTION", "__", "OPERATION"], "postprocess": function(d) {return [d[0], d[2], d[4], d[6]]}},
       {"name": "EXPRESSION", "symbols": ["INOPTION", "__", "OUTOPTION", "__", "DEBUGOPTION", "__", "OPERATION"], "postprocess": function(d) {return [d[0], d[2], d[4],d[6]]}},
       {"name": "INOPTION$subexpression$1", "symbols": [/[iI]/, /[nN]/, /[fF]/, /[iI]/, /[eE]/, /[lL]/, /[dD]/], "postprocess": function(e){return e.join("")}},
       {"name": "INOPTION", "symbols": ["INOPTION$subexpression$1", "_", {"literal":"=","pos":115}, "_", "FIELDNAME"], "postprocess": function(d) {return {infield:d[4]}}},
       {"name": "INOPTION$subexpression$2", "symbols": [/[iI]/, /[nN]/, /[fF]/, /[iI]/, /[eE]/, /[lL]/, /[dD]/], "postprocess": function(e){return e.join("")}},
       {"name": "INOPTION", "symbols": ["INOPTION$subexpression$2", "_", {"literal":"=","pos":130}, "_", {"literal":"\"","pos":134}, "FIELDNAME", {"literal":"\"","pos":138}], "postprocess": function(d) {return {infield:d[5]}}},
       {"name": "INOPTION$subexpression$3", "symbols": [/[iI]/, /[nN]/, /[fF]/, /[iI]/, /[eE]/, /[lL]/, /[dD]/], "postprocess": function(e){return e.join("")}},
       {"name": "INOPTION", "symbols": ["INOPTION$subexpression$3", "_", {"literal":"=","pos":149}, "_", {"literal":"'","pos":153}, "QUOTEDFIELDNAME", {"literal":"'","pos":157}], "postprocess": function(d) {return {infield:d[5]}}},
       {"name": "DEBUGOPTION$subexpression$1", "symbols": [/[dD]/, /[eE]/, /[bB]/, /[uU]/, /[gG]/], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION$subexpression$2", "symbols": [/[iI]/, /[nN]/, /[fF]/, /[oO]/], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION", "symbols": ["DEBUGOPTION$subexpression$1", "_", {"literal":"=","pos":170}, "_", "DEBUGOPTION$subexpression$2"], "postprocess": function(d) {return {debug:"info"}}},
       {"name": "DEBUGOPTION$subexpression$3", "symbols": [/[dD]/, /[eE]/, /[bB]/, /[uU]/, /[gG]/], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION$subexpression$4", "symbols": [{"literal":"\""}, /[iI]/, /[nN]/, /[fF]/, /[oO]/, {"literal":"\""}], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION", "symbols": ["DEBUGOPTION$subexpression$3", "_", {"literal":"=","pos":186}, "_", "DEBUGOPTION$subexpression$4"], "postprocess": function(d) {return {debug:"info"}}},
       {"name": "DEBUGOPTION$subexpression$5", "symbols": [/[dD]/, /[eE]/, /[bB]/, /[uU]/, /[gG]/], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION$subexpression$6", "symbols": [/[fF]/, /[uU]/, /[lL]/, /[lL]/], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION", "symbols": ["DEBUGOPTION$subexpression$5", "_", {"literal":"=","pos":202}, "_", "DEBUGOPTION$subexpression$6"], "postprocess": function(d) {return {debug:"full"}}},
       {"name": "DEBUGOPTION$subexpression$7", "symbols": [/[dD]/, /[eE]/, /[bB]/, /[uU]/, /[gG]/], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION$subexpression$8", "symbols": [{"literal":"\""}, /[fF]/, /[uU]/, /[lL]/, /[lL]/, {"literal":"\""}], "postprocess": function(e){return e.join("")}},
       {"name": "DEBUGOPTION", "symbols": ["DEBUGOPTION$subexpression$7", "_", {"literal":"=","pos":218}, "_", "DEBUGOPTION$subexpression$8"], "postprocess": function(d) {return {debug:"full"}}},
       {"name": "OUTOPTION$subexpression$1", "symbols": [/[oO]/, /[uU]/, /[tT]/, /[fF]/, /[iI]/, /[eE]/, /[lL]/, /[dD]/], "postprocess": function(e){return e.join("")}},
       {"name": "OUTOPTION", "symbols": ["OUTOPTION$subexpression$1", "_", {"literal":"=","pos":236}, "_", "FIELDNAME"], "postprocess": function(d) {return {outfield:d[4]}}},
       {"name": "OUTOPTION$subexpression$2", "symbols": [/[oO]/, /[uU]/, /[tT]/, /[fF]/, /[iI]/, /[eE]/, /[lL]/, /[dD]/], "postprocess": function(e){return e.join("")}},
       {"name": "OUTOPTION", "symbols": ["OUTOPTION$subexpression$2", "_", {"literal":"=","pos":251}, "_", {"literal":"\"","pos":255}, "FIELDNAME", {"literal":"\"","pos":259}], "postprocess": function(d) {return {outfield:d[5]}}},
       {"name": "OUTOPTION$subexpression$3", "symbols": [/[oO]/, /[uU]/, /[tT]/, /[fF]/, /[iI]/, /[eE]/, /[lL]/, /[dD]/], "postprocess": function(e){return e.join("")}},
       {"name": "OUTOPTION", "symbols": ["OUTOPTION$subexpression$3", "_", {"literal":"=","pos":270}, "_", {"literal":"'","pos":274}, "QUOTEDFIELDNAME", {"literal":"'","pos":278}], "postprocess": function(d) {return {outfield:d[5]}}},
       {"name": "OPERATION", "symbols": ["RECIPEOPTION"], "postprocess": id},
       {"name": "OPERATION", "symbols": ["OPPOPTION"], "postprocess": id},
       {"name": "OPERATION", "symbols": ["B64RECIPE"], "postprocess": id},
       {"name": "OPERATION", "symbols": ["JSONRECIPE"], "postprocess": id},
       {"name": "RECIPEOPTION$subexpression$1", "symbols": [/[rR]/, /[eE]/, /[cC]/, /[iI]/, /[pP]/, /[eE]/], "postprocess": function(e){return e.join("")}},
       {"name": "RECIPEOPTION$ebnf$1", "symbols": [/[\w]/]},
       {"name": "RECIPEOPTION$ebnf$1", "symbols": [/[\w]/, "RECIPEOPTION$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "RECIPEOPTION", "symbols": ["RECIPEOPTION$subexpression$1", "_", {"literal":"=","pos":317}, "_", "RECIPEOPTION$ebnf$1"], "postprocess": function(d) {return {recipe:d[4].join('')}}},
       {"name": "RECIPEOPTION$subexpression$2", "symbols": [/[rR]/, /[eE]/, /[cC]/, /[iI]/, /[pP]/, /[eE]/], "postprocess": function(e){return e.join("")}},
       {"name": "RECIPEOPTION", "symbols": ["RECIPEOPTION$subexpression$2", "_", {"literal":"=","pos":333}, "_", {"literal":"\"","pos":337}, "QUOTEDOPTCHARS", {"literal":"\"","pos":341}], "postprocess": function(d) {return {recipe:d[5]}}},
       {"name": "OPPOPTION$subexpression$1", "symbols": [/[oO]/, /[pP]/, /[eE]/, /[rR]/, /[aA]/, /[tT]/, /[iI]/, /[oO]/, /[nN]/], "postprocess": function(e){return e.join("")}},
       {"name": "OPPOPTION$ebnf$1", "symbols": [/[\w]/]},
       {"name": "OPPOPTION$ebnf$1", "symbols": [/[\w]/, "OPPOPTION$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "OPPOPTION", "symbols": ["OPPOPTION$subexpression$1", "_", {"literal":"=","pos":354}, "_", "OPPOPTION$ebnf$1"], "postprocess": function(d) {return {operation:d[4].join('')}}},
       {"name": "OPPOPTION$subexpression$2", "symbols": [/[oO]/, /[pP]/, /[eE]/, /[rR]/, /[aA]/, /[tT]/, /[iI]/, /[oO]/, /[nN]/], "postprocess": function(e){return e.join("")}},
       {"name": "OPPOPTION", "symbols": ["OPPOPTION$subexpression$2", "_", {"literal":"=","pos":370}, "_", {"literal":"\"","pos":374}, "QUOTEDOPTCHARS", {"literal":"\"","pos":378}], "postprocess": function(d) {return {operation:d[5]}}},
       {"name": "B64RECIPE$subexpression$1", "symbols": [/[bB]/, {"literal":"6"}, {"literal":"4"}, /[rR]/, /[eE]/, /[cC]/, /[iI]/, /[pP]/, /[eE]/], "postprocess": function(e){return e.join("")}},
       {"name": "B64RECIPE$ebnf$1", "symbols": [/[a-zA-Z0-9=/+]/]},
       {"name": "B64RECIPE$ebnf$1", "symbols": [/[a-zA-Z0-9=/+]/, "B64RECIPE$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "B64RECIPE", "symbols": ["B64RECIPE$subexpression$1", "_", {"literal":"=","pos":391}, "_", "B64RECIPE$ebnf$1"], "postprocess": function(d) {return {b64recipe:d[4].join('')}}},
       {"name": "B64RECIPE$subexpression$2", "symbols": [/[bB]/, {"literal":"6"}, {"literal":"4"}, /[rR]/, /[eE]/, /[cC]/, /[iI]/, /[pP]/, /[eE]/], "postprocess": function(e){return e.join("")}},
       {"name": "B64RECIPE$ebnf$2", "symbols": [/[a-zA-Z0-9=/+]/]},
       {"name": "B64RECIPE$ebnf$2", "symbols": [/[a-zA-Z0-9=/+]/, "B64RECIPE$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "B64RECIPE", "symbols": ["B64RECIPE$subexpression$2", "_", {"literal":"=","pos":407}, "_", {"literal":"\"","pos":411}, "B64RECIPE$ebnf$2", {"literal":"\"","pos":416}], "postprocess": function(d) {return {b64recipe:d[5].join('')}}},
       {"name": "JSONRECIPE$subexpression$1", "symbols": [/[jJ]/, /[sS]/, /[oO]/, /[nN]/, /[rR]/, /[eE]/, /[cC]/, /[iI]/, /[pP]/, /[eE]/], "postprocess": function(e){return e.join("")}},
       {"name": "JSONRECIPE", "symbols": ["JSONRECIPE$subexpression$1", "_", {"literal":"=","pos":429}, "_", {"literal":"\"","pos":433}, "QUOTEDOPTCHARS", {"literal":"\"","pos":437}], "postprocess": function(d) {return {jsonRecipe:d[5]}}},
       {"name": "FIELDNAME$ebnf$1", "symbols": []},
       {"name": "FIELDNAME$ebnf$1", "symbols": ["FIELDNAMECHARS", "FIELDNAME$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "FIELDNAME", "symbols": [/[a-zA-Z]/, "FIELDNAME$ebnf$1"], "postprocess": function(d) {return  d[0].concat(d[1].join('')) }},
       {"name": "FIELDNAMECHARS", "symbols": [/[\w]/], "postprocess": id},
       {"name": "QUOTEDFIELDNAME$ebnf$1", "symbols": ["QUOTEDFIELDNAMECHAR"]},
       {"name": "QUOTEDFIELDNAME$ebnf$1", "symbols": ["QUOTEDFIELDNAMECHAR", "QUOTEDFIELDNAME$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "QUOTEDFIELDNAME", "symbols": ["QUOTEDFIELDNAME$ebnf$1"], "postprocess": function(d) {return  d[0].join('') }},
       {"name": "QUOTEDFIELDNAMECHAR$string$1", "symbols": [{"literal":"\\"}, {"literal":"|"}], "postprocess": function joiner(d) {return d.join('');}},
       {"name": "QUOTEDFIELDNAMECHAR", "symbols": ["QUOTEDFIELDNAMECHAR$string$1"], "postprocess": function(d) {return  "|" }},
       {"name": "QUOTEDFIELDNAMECHAR$string$2", "symbols": [{"literal":"\\"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
       {"name": "QUOTEDFIELDNAMECHAR", "symbols": ["QUOTEDFIELDNAMECHAR$string$2"], "postprocess": function(d) {return  "'" }},
       {"name": "QUOTEDFIELDNAMECHAR", "symbols": [/[ -&]/], "postprocess": id},
       {"name": "QUOTEDFIELDNAMECHAR", "symbols": [/[(-{]/], "postprocess": id},
       {"name": "QUOTEDFIELDNAMECHAR", "symbols": [/[}-~]/], "postprocess": id},
       {"name": "QUOTEDOPTCHARS$ebnf$1", "symbols": ["QUOTEDOPTCHAR"]},
       {"name": "QUOTEDOPTCHARS$ebnf$1", "symbols": ["QUOTEDOPTCHAR", "QUOTEDOPTCHARS$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
       {"name": "QUOTEDOPTCHARS", "symbols": ["QUOTEDOPTCHARS$ebnf$1"], "postprocess": function(d) {return  d[0].join('') }},
       {"name": "QUOTEDOPTCHAR$string$1", "symbols": [{"literal":"\\"}, {"literal":"|"}], "postprocess": function joiner(d) {return d.join('');}},
       {"name": "QUOTEDOPTCHAR", "symbols": ["QUOTEDOPTCHAR$string$1"], "postprocess": function(d) {return  "|" }},
       {"name": "QUOTEDOPTCHAR", "symbols": [/[ -{]/], "postprocess": id},
       {"name": "QUOTEDOPTCHAR", "symbols": [/[}-~]/], "postprocess": id}
   ]
     , ParserStart: "E"
   }
   if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
      module.exports = grammar;
   } else {
      window.grammar = grammar;
   }
   })();
   