# This grammar is used by the "CyberChef for Splunk" App to parse the SPL options passed to the App from Splunk.
# It  must be compiled to javascript using the nearley compiler.

# https://nearley.js.org/docs/grammar
# https://omrelli.ug/nearley-playground/

# to generate js: node.exe nearleyc.js grammar.ne -o grammar.js

# v4: replace 'command' with 'operation'

@builtin "whitespace.ne" # definitions for whitespace

# remove any surounding whitespace from the ends of the string
E				-> _ EXPRESSION _ {% function(d) {return d[1]}  %}

# our expression could have the options in any order. we require INFIELD and either RECIPE OR COMMAND option
EXPRESSION		-> 	INOPTION __ OPTIONALCMDS				{% function(d) {return [d[0], d[2]]}  %}
					| OPTIONALCMDS __ INOPTION				{% function(d) {return [d[0], d[2]]}  %}
					
					| INOPTION __ OUTOPTION __ OPTIONALCMDS	{% function(d) {return [d[0], d[2], d[4]]}  %}
					| INOPTION __ OPTIONALCMDS __ OUTOPTION	{% function(d) {return [d[0], d[2], d[4]]}  %}
					
					| OUTOPTION __ INOPTION __ OPTIONALCMDS	{% function(d) {return [d[0], d[2], d[4]]}  %}
					| OUTOPTION __ OPTIONALCMDS __ INOPTION	{% function(d) {return [d[0], d[2], d[4]]}  %}
					
					| OPTIONALCMDS __ INOPTION __ OUTOPTION	{% function(d) {return [d[0], d[2], d[4]]}  %}
					| OPTIONALCMDS __ OUTOPTION __ INOPTION	{% function(d) {return [d[0], d[2], d[4]]}  %}

INOPTION 		-> 	"infield"i _ "=" _ FIELDNAME					{% function(d) {return {infield:d[4]}}  %}
				|	"infield"i _ "=" _ "'" QUOTEDFIELDNAME "'"		{% function(d) {return {infield:d[5]}}  %}
				|	"infield"i _ "=" _ "\"" QUOTEDFIELDNAME "\""	{% function(d) {return {infield:d[5]}}  %}

OUTOPTION 		-> 	"outfield"i _ "=" _ FIELDNAME					{% function(d) {return {outfield:d[4]}}  %}
				|	"outfield"i _ "=" _ "'" QUOTEDFIELDNAME "'"		{% function(d) {return {outfield:d[5]}}  %}
				|	"outfield"i _ "=" _ "\"" QUOTEDFIELDNAME "\""	{% function(d) {return {outfield:d[5]}}  %}
				
OPTIONALCMDS	->	RECIPEOPTION 	{% id %}
				|	OPPOPTION		{% id %}
				|	B64RECIPE		{% id %}
				|	JSONRECIPE		{% id %}

RECIPEOPTION	->	"recipe"i _ "=" _ [\w]:+					{% function(d) {return {recipe:d[4].join('')}}  %}
				|	"recipe"i _ "=" _ "\"" QUOTEDOPT "\"" 		{% function(d) {return {recipe:d[5]}}  %}
				|	"recipe"i _ "=" _ "'" QUOTEDOPT "'" 		{% function(d) {return {recipe:d[5]}}  %}
				
OPPOPTION		-> 	"operation"i _ "=" _ [\w]:+					{% function(d) {return {operation:d[4].join('')}}  %}
				|	"operation"i _ "=" _ "\"" QUOTEDOPT "\"" 	{% function(d) {return {operation:d[5]}}  %}
				|	"operation"i _ "=" _ "'" QUOTEDOPT "'" 		{% function(d) {return {operation:d[5]}}  %}
				
B64RECIPE		-> 	"b64recipe"i _ "=" _ [a-zA-Z0-9=/+]:+					{% function(d) {return {b64recipe:d[4].join('')}}  %}
				|	"b64recipe"i _ "=" _ "\"" [a-zA-Z0-9=/+]:+ "\"" 		{% function(d) {return {b64recipe:d[5].join('')}}  %}
				|	"b64recipe"i _ "=" _ "'" [a-zA-Z0-9=/+]:+ "'" 			{% function(d) {return {b64recipe:d[5].join('')}}  %}

JSONRECIPE		-> "jsonRecipe"i _ "=" _ "\"" JSONCHARS "\"" 		{% function(d) {return {jsonRecipe:d[5]}}  %}
				
# for standard FieldNames. Start with a letter, then any letter, number, or underscore
FIELDNAME		-> [a-zA-Z] FIELDNAMECHARS:*		{% function(d) {return  d[0].concat(d[1].join('')) }  %}
FIELDNAMECHARS	-> [\w] 							{% id %}

# Quoted FieldNames, can include spaces, periods, and colons. can start with anything
# https://community.splunk.com/t5/Archive/Which-characters-does-Splunk-allow-in-field-names/m-p/427039
QUOTEDFIELDNAME			-> 	QUOTEDFIELDNAMECHAR:+		{% function(d) {return  d[0].join('') }  %}
QUOTEDFIELDNAMECHAR		-> 	[\w]		{% id %}
						|	" " 		{% id %}
						| 	[.:] 		{% id %}

# CHARSET for the options, lots of possibilities here
QUOTEDOPT		-> 	QUOTEDOPTCHAR:+		{% function(d) {return  d[0].join('') }  %}
QUOTEDOPTCHAR 	-> 	[\w] 				{% id %}
				| 	[(){}\\,.\[\]:-] 	{% id %}
				| 	"@" 			 	{% id %} 
				| 	"#" 			 	{% id %}     
				| 	"\"" 				{% id %}
				| 	" "  				{% id %}
				
# CHARSET for the options, lots of possibilities here
JSONCHARS		-> 	JSONCHAR:+		{% function(d) {return  d[0].join('') }  %}
JSONCHAR	 	-> 	[ -~]				{% id %}  # all ASCII chars from space to tilde
#				|	[\w] 				{% id %}
#				| 	[(){}\\,.\[\]:-] 	{% id %}
#				|	[+/=']				{% id %}
#				| 	"@" 			 	{% id %} 
#				| 	"#" 			 	{% id %}     
#				| 	"\"" 				{% id %}
#				| 	" "  				{% id %}