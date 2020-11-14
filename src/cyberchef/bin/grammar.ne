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

RECIPEOPTION	->	"savedrecipe"i _ "=" _ [\w]:+						{% function(d) {return {savedrecipe:d[4].join('')}}  %}
				|	"savedrecipe"i _ "=" _ "\"" QUOTEDOPTCHARS "\"" 		{% function(d) {return {savedrecipe:d[5]}}  %}
				|	"savedrecipe"i _ "=" _ "'" QUOTEDOPTCHARS "'" 		{% function(d) {return {savedrecipe:d[5]}}  %}
				
OPPOPTION		-> 	"operation"i _ "=" _ [\w]:+						{% function(d) {return {operation:d[4].join('')}}  %}
				|	"operation"i _ "=" _ "\"" QUOTEDOPTCHARS "\"" 	{% function(d) {return {operation:d[5]}}  %}
				|	"operation"i _ "=" _ "'" QUOTEDOPTCHARS "'" 	{% function(d) {return {operation:d[5]}}  %}
				
B64RECIPE		-> 	"encodedrecipe"i _ "=" _ [a-zA-Z0-9=/+]:+				{% function(d) {return {encodedrecipe:d[4].join('')}}  %}
				|	"encodedrecipe"i _ "=" _ "\"" [a-zA-Z0-9=/+]:+ "\"" 	{% function(d) {return {encodedrecipe:d[5].join('')}}  %}
				|	"encodedrecipe"i _ "=" _ "'" [a-zA-Z0-9=/+]:+ "'" 	{% function(d) {return {encodedrecipe:d[5].join('')}}  %}

JSONRECIPE		-> 	"jsonrecipe"i _ "=" _ "\"" QUOTEDOPTCHARS "\"" 		{% function(d) {return {jsonRecipe:d[5]}}  %}
				|	"jsonrecipe"i _ "=" _ "'" QUOTEDOPTCHARS "'" 		{% function(d) {return {jsonRecipe:d[5]}}  %}
				
# unquoted and double-quoted fieldnames (this is more permissive than SPL2 syntax, but is easier and just as clear)
FIELDNAME		->[\w]:+		{% function(d) {return  d[0].join('') }  %}

# Fieldnames that are single-quoted can be anything (except the single quote or pipe, unless escaped)
# todo: pipe not supported here
QUOTEDFIELDNAME			-> 	QUOTEDFIELDNAMECHAR:+	{% function(d) {return  d[0].join('') }  %}
QUOTEDFIELDNAMECHAR		-> 	"\\|"					{% function(d) {return  "|" }  %} # escaped pipe (ASCII 125)
						|	"\\'"					{% function(d) {return  "'" }  %} # escaped single quote (ASCII 39)
						|	[ -&]					{% id %}  # ASCII 32 (space) through 38 (ampersand)
						| 	[(-{]					{% id %}  # ASCII 40 (r-paren) through 123 (l-bracket)
						|	[}-~]					{% id %}  # ASCII 125 (r-bracket) through 126 (tilde)
						
# String values that are quoted, only the pipe needs to be escaped (we don't have to escape single or double-quotes
# because we force this option to be the last field.
QUOTEDOPTCHARS	-> 	QUOTEDOPTCHAR:+		{% function(d) {return  d[0].join('') }  %}
QUOTEDOPTCHAR 	-> 	"\\|"				{% function(d) {return  "|" }  %} # escaped pipe (ASCII 125)
				|	[ -{]				{% id %}  # ASCII 32 (space) through  123 (l-bracket)
				|	[}-~]				{% id %}  # ASCII 125 (r-bracket) through 126 (tilde)
