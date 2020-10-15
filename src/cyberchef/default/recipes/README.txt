The 'recipes' folders located in the 'default' and 'local' folders are to store json-encoded CyberChef recipes that you can refernce from the cyberchef custom search command this app provides.  These two folders will be scanned for text files, and recipes will be loaded from those files. 

Recipes in these files must follow the following format:

###############################
# 			FORMAT
###############################
# this is a comment
recipe_name : json_encoded_recipe


The recipe name is seperated from the actual recipe with a colon. 

recipe_name 			Is made up of alpha-numeric characters.  
						The recipe_name is how you will refer to the recipe in Splunk.
json_encoded_recipe 	Is a recipe from CyberChef, encoded as 'compact json'.  
						This will be a single line of text.


###############################
# 			EXAMPLE
###############################
# base64 example:
myToBase64 : [{"op":"To Base64","args":["A-Za-z0-9+/="]}]

# Convert to Base64, then to Binary:
b64_to_binary : [{"op":"To Base64","args":["A-Za-z0-9+/="]},{"op":"To Binary","args":["Space"]}]

# to Base58, then moorse code using DASH DAH format
myCrazyRecipe 	: [{"op":"To Base58","args":["123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"]},{"op":"To Morse Code","args":["DASH/DOT","Space","Line feed"]}]


To create the json, open the CyberChef Gui, build your command and then click the "save" icon. Click on the "compact json" tab, and select the text.

###############################
# 		USAGE EXAMPLE
###############################
To use one of the recipes above, just reference it in Splunk:

... | cyberchef infield="whatever" recipe=myCrazyRecipe | ...
... | cyberchef infield="whatever" outfield = 'whateverOUT' recipe='b64_to_binary' | ...


###############################
# 		IMPORTANT NOTES
###############################
* You can use whatever whitespace you want around the colon seperating the receipe name from the json.
* you can have blank lines
* recipe_name must be alpha-numeric chars (\w in regex)
* comments are lines that start with a non-aphanumeric char (^\w)
* you should create ../local/recipes folder to hold all your recipes, not use the 'default' folder (which gets overwritten if you upgrade this app)
* the text file that you create to hold your recipes can have any name (but can't have the word 'readme' in the name).






