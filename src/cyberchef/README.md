# CyberChef for Splunk
This Splunk App provides a Custom Search Command name **cyberchef** that allows you to apply [CyberChef](https://github.com/gchq/CyberChef) operations and recipes to your search results.  This App also provides a local version of the CyberChef GUI.

## Quick Example:
```
search * 
| fields b64data 
| cyberchef infield='b64data' outfield='convertedData' operation="FromBase64" 
| table b64data convertedData
```
output:
```
b64data                     | convertedData
--------------------------- | ------------------
Y2FuZHliYXJz                | candybars
Y29tcHV0ZXIgc2F5cyBubw==    | computer says no
```

This App is released under the GPL v3 license. Please see the [LICENSE](./LICENSE-GPL_v3) file, and CyberChef is released under the [Apache 2.0 Licence](./LICENSE-Apache_v2.0) and is covered by [Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/copyright-and-re-use/crown-copyright/). 

# Installing This App
You should install this App on all your Splunk Indexers and Search Heads (there is no benefit or harm to installing it on any forwarders).  A reboot of Splunk is required after installation. No configuration is required to use this App after installation.

# Using this App
This App will allow you to apply CyberChef operations and recipes through a custom search command named **cyberchef**.  This custom search command requires that you specify the input field to operate on, the CyberChef operation or recipe to apply to the data in that field, and optionally a different output field to write the results to.

In the simplest usage: the following SPL will apply the "toBase64" operation to the "inData" field, and save the results back to the "inData" field (overwriting the original field).
```
... | cyberchef infield='inData' operation="ToBase64" |...
```

There are three ways to specify the CyberChef operation or recipe. You must choose one of these options:
1. **operation**:  A single operation with no parameters.
1. **b64recipe**:  A recipe saved as compact json, then converted to base64.    
1. **recipe**:  A recipe in saved as compact json, saved to a text file located in this App's *./local/recipes/* folder.

You must choose one of the above options when running this command.  See below for specific examples.

A CyberChef operation is a single modification of your data. For example: converting data from a base64-encoded string using the *FromBase64* operation.  A recipe is one or more operations chained together, where each operation can have optional parameters.  For example: converting data into a base64-encoded string (using the *ToBase64* operation), and then calcuating the SHA3 hash with an output size of 256 of that base64 encoded data using the *SHA3* operation with the 256 output-size option.

Reipces (versus operations) must be formated in CyberChef's compact json format (more information below), which can be done through the CyberChef GUI.

## operation
This is the simplest method, and allows you to apply a single CyberChef operation without any parameters.

Operation names are camelCase versions of the operations on the web app, except for when the operation name begins with more than one uppercase character. For example, "Zlib Deflate" becomes zlibDeflate, but "SHA2" stays as SHA2.

```
... | cyberchef infield='inData' operation="ToBase64" |...
```

If you want to save the results to a different (or newly created field), include the 'outfield' option:
```
... | cyberchef infield='inData' outfield="outData" operation="ToBase64" |...
```

## b64recipe
If you need to use multiple operations (a recipe), or your operations require parameters, you can't use the *operation* option. One way to solve this is with the *b64recipe* option. This allows you to specify a recipe in your SPL comand.  The recipe is compact-json, and must be base64-encoded.  

To create this base64 string string: From the CyberChef GUI, construct your recipe by dragging the opeations you want to the "recipe" section.  once the recipe is correct: click the "save" icon at the top (the floppy disc icon), and then select the "compact json" tab. This is the compact-json representation of this recipe. You then need to convert that json string into a base64-encoded string (using the CyberChef GUI and the ToBase64 operation), and use the result for this field.
(This process is a little convoluted, but Splunk can't handle json in SPL, so this workaround is required. Look at the *recipe* option below as another alternative).

For example, if you wanted a recipe to convert a string from base64 and then generate the SHA2 hash, you would build this recipe in the CyberChef GUI, click the "save" button, click on the "compact json" tab to get the following recipe in compact json format:
```
[{"op":"From Base64","args":["A-Za-z0-9+/=",true]},{"op":"SHA3","args":["512"]}]
```

Next: You need to convert this json string into a base64 encoded string (using cyberchef's toBase64 function in the GUI). This gives us the follwoing string:
```
W3sib3AiOiJGcm9tIEJhc2U2NCIsImFyZ3MiOlsiQS1aYS16MC05Ky89Iix0cnVlXX0seyJvcCI6IlNIQTMiLCJhcmdzIjpbIjUxMiJdfV0=
```

that string is now the value for the *b64recipe* option:
```
... | cyberchef infield = 'inData' b64recipe = "W3sib3AiOiJGcm9tIEJhc2U2NCIsImFyZ3MiOlsiQS1aYS16MC05Ky89Iix0cnVlXX0seyJvcCI6IlNIQTMiLCJhcmdzIjpbIjUxMiJdfV0=" |...
```

 ## recipe
If you find yourself using the same recipes over and over, you can save them in this App's "./local/recipe" folder with a nickname to easily reference them. 

first create a *./local/recipe/myRecipes.txt* text file.  In this file, add the following content:
```
# Comment: the line below is a recipe you can reference from the cyberchef custom search command
myComplexRecipe  :  [{"op":"SHA3","args":["512"]}]

```

you don't need to reboot Splunk. Run the following SPL to reference this recipe:
```
... | cyberchef infield = 'inData' recipe = "myComplexRecipe" |...
```

See the [./default/recipes/READEME.txt](./default/recipes/READEME.txt) file for more details.

# Support
Please submit bug and feature requests via [Github](https://github.com/NDietrich/CyberChef-for-Splunk/issues), or email Noah@SublimeRobots.com.  Please include as much information as possible with your request.  This App is not professionally supported (it is a volunteer project), so issues may not be fixed immediately, but I will make every effort to reply.

CyberChef is released under the [Apache 2.0 Licence](https://www.apache.org/licenses/LICENSE-2.0) and is covered by [Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/copyright-and-re-use/crown-copyright/). 