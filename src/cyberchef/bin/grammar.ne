@builtin "whitespace.ne" # definitions for whitespace

# what to quote and escape (SPL2)
# https://docs.splunk.com/Documentation/SCS/current/Search/Quotations
# https://docs.splunk.com/Documentation/Splunk/8.1.0/Search/Aboutsearchlanguagesyntax#Quotes_and_escaping_characters
# https://docs.splunk.com/Documentation/SCS/current/SearchReference/DifferencesbetweenSPLandSPL2#Quotations

# remove any surounding whitespace from the ends of the string
E				-> _ EXPRESSION _ {% function(d) {return d[1]}  %}

# our expression could have the options in any order. we require INFIELD and either RECIPE OR COMMAND option
EXPRESSION		-> 	INOPTION __ OPERATION					{% function(d) {return [d[0], d[2]]}  %}
				|	INOPTION __ DEBUGOPTION __ OPERATION	{% function(d) {return [d[0], d[2], d[4]]}  %}
				|	INOPTION __ OUTOPTION __ OPERATION	{% function(d) {return [d[0], d[2], d[4]]}  %}
				|	INOPTION __ DEBUGOPTION __ OUTOPTION __ OPERATION	{% function(d) {return [d[0], d[2], d[4], d[6]]}  %}
				|	INOPTION __ OUTOPTION __ DEBUGOPTION __ OPERATION	{% function(d) {return [d[0], d[2], d[4],d[6]]}  %}

INOPTION 		-> 	"infield"i _ "=" _ FIELDNAME					{% function(d) {return {infield:d[4]}}  %}
				|	"infield"i _ "=" _ "\"" FIELDNAME "\""			{% function(d) {return {infield:d[5]}}  %}
				|	"infield"i _ "=" _ "'" QUOTEDFIELDNAME "'"		{% function(d) {return {infield:d[5]}}  %}

DEBUGOPTION		->	"debug"i _ "=" _ "info"i			{% function(d) {return {debug:"info"}}  %}
				|	"debug"i _ "=" _ "\"info\""i		{% function(d) {return {debug:"info"}}  %}
				|	"debug"i _ "=" _ "full"i			{% function(d) {return {debug:"full"}}  %}
				|	"debug"i _ "=" _ "\"full\""i		{% function(d) {return {debug:"full"}}  %}

OUTOPTION 		-> 	"outfield"i _ "=" _ FIELDNAME					{% function(d) {return {outfield:d[4]}}  %}
				|	"outfield"i _ "=" _ "\"" FIELDNAME "\""			{% function(d) {return {outfield:d[5]}}  %}
				|	"outfield"i _ "=" _ "'" QUOTEDFIELDNAME "'"		{% function(d) {return {outfield:d[5]}}  %}

OPERATION		->	RECIPEOPTION 	{% id %}
				|	OPPOPTION		{% id %}
				|	B64RECIPE		{% id %}
				|	JSONRECIPE		{% id %}

RECIPEOPTION	->	"recipe"i _ "=" _ [\w]:+					{% function(d) {return {recipe:d[4].join('')}}  %}
				|	"recipe"i _ "=" _ "\"" QUOTEDOPTCHARS "\"" 		{% function(d) {return {recipe:d[5]}}  %}
				
OPPOPTION		-> 	"operation"i _ "=" _ [\w]:+				{% function(d) {return {operation:d[4].join('')}}  %}
				|	"operation"i _ "=" _ "\"" QUOTEDOPTCHARS "\"" 	{% function(d) {return {operation:d[5]}}  %}
				
B64RECIPE		-> 	"b64recipe"i _ "=" _ [a-zA-Z0-9=/+]:+	{% function(d) {return {b64recipe:d[4].join('')}}  %}
				|	"b64recipe"i _ "=" _ "\"" [a-zA-Z0-9=/+]:+ "\"" 		{% function(d) {return {b64recipe:d[5].join('')}}  %}

JSONRECIPE		-> "jsonRecipe"i _ "=" _ "\"" QUOTEDOPTCHARS "\"" 		{% function(d) {return {jsonRecipe:d[5]}}  %}
				
# for standard FieldNames. Start with a letter, then any letter, number, or underscore
# spl2 may allow \w for all fieldnames here, todo
FIELDNAME		-> [a-zA-Z] FIELDNAMECHARS:*		{% function(d) {return  d[0].concat(d[1].join('')) }  %}
FIELDNAMECHARS	-> [\w] 							{% id %}

# Fieldnames that are single-quoted can be anything (except the single quote, unless escaped)
# todo: pipe not supported here
QUOTEDFIELDNAME			-> 	QUOTEDFIELDNAMECHAR:+	{% function(d) {return  d[0].join('') }  %}
QUOTEDFIELDNAMECHAR		-> 	"\\|"					{% function(d) {return  "|" }  %} # escaped pipe (ASCII 125)
						|	"\\'"					{% function(d) {return  "'" }  %} # escaped single quote (ASCII 39)
						|	[ -&]					{% id %}  # ASCII 32 (space) through 38 (ampersand)
						| 	[(-{]					{% id %}  # ASCII 40 (r-paren) through 123 (l-bracket)
						|	[}-~]					{% id %}  # ASCII 125 (r-bracket) through 126 (tilde)
						
# String values that contain anything other than a-z, A-Z, 0-9, or the underscore ( _ ) character, 
# need double quotation marks. This includes the wildcard ( * ) character.
# CHARSET for the options
QUOTEDOPTCHARS	-> 	QUOTEDOPTCHAR:+		{% function(d) {return  d[0].join('') }  %}
QUOTEDOPTCHAR 	-> 	"\\|"				{% function(d) {return  "|" }  %} # escaped pipe (ASCII 125)
				|	[ -{]				{% id %}  # ASCII 32 (space) through  123 (l-bracket)
				|	[}-~]				{% id %}  # ASCII 125 (r-bracket) through 126 (tilde)
