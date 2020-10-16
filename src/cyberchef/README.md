# CyberChef for Splunk
This Splunk App provides a Custom Search Command named **cyberchef** that allows you to apply [CyberChef](https://github.com/gchq/CyberChef) operations and recipes to your search results.  This App also provides a local version of the CyberChef web GUI.

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

This App is released under the GPL v3 license. Please see the [LICENSE](./LICENSE-GPL_v3) file.  CyberChef is released under the [Apache 2.0 Licence](./LICENSE-Apache_v2.0) and is covered by [Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/copyright-and-re-use/crown-copyright/). 

# Installing This App
You should install this App on all your Splunk Indexers and Search Heads (there is no benefit or harm to installing it on any forwarders).  A reboot of Splunk is required after installation. No configuration is required to use this App after installation.

# Using this App
This App will allow you to apply CyberChef operations and recipes through a custom search command named **cyberchef**.  This custom search command requires that you specify the input field to operate on, the CyberChef operation or recipe to apply to the data in that field, and optionally a different output field to write the results to.

In the simplest usage: the following SPL will apply the "toBase64" operation to the "inData" field, and save the results back to the "inData" field (overwriting the original field).
```
... | cyberchef infield='inData' operation="ToBase64" |...
```

There are three ways to specify the CyberChef operation or recipe. You must choose one of these parameters:
1. **operation**:  A single operation with no parameters.
1. **b64recipe**:  A recipe saved as compact json, then converted to base64.    
1. **recipe**:  A recipe in saved as compact json, saved to a text file located in this App's *./local/recipes/* folder.

You must choose one of the above parameters when running this command.  See below for specific examples.

A CyberChef **operation** is a single function applied to the specified field for each event from your data. For example: converting data from a base64-encoded string using the *FromBase64* operation.  

A CyberChef **recipe** is one or more operations chained together, where each operation can have optional parameters.  For example: converting data into a base64-encoded string (using the *ToBase64* operation), and then calcuating the SHA3 hash with an output size of 256 of that base64 encoded data using the *SHA3* operation with the 256 output-size option.

Reipces (versus operations) must be formated in CyberChef's compact json format (more information below), which can be done through the CyberChef web GUI.

## **operation** parameter
This is the simplest method, and allows you to apply a single CyberChef operation without any parameters.

From the CyberChef node.js API documentation:  *Operation names are camelCase versions of the operations on the web app, except for when the operation name begins with more than one uppercase character. For example, "Zlib Deflate" becomes zlibDeflate, but "SHA2" stays as SHA2.*  That being said: this App's implementation of CyberChef is really flexible with naming, see the section below **CyberChef Operation Names**.

```
... | cyberchef infield='inData' operation="ToBase64" |...
```

If you want to save the results to a different (or newly created field), include the 'outfield' parameter:
```
... | cyberchef infield='inData' outfield="outData" operation="ToBase64" |...
```

## **b64recipe** parameter
If you need to use multiple operations (a recipe), or your operations require parameters, you can't use the **operation** parameter. One way to solve this is with the **b64recipe** parameter. This allows you to specify a recipe in your SPL comand.  The recipe is compact-json, and must be base64-encoded.  

To create this base64 string string: From the CyberChef GUI, construct your recipe by dragging the opeations you want to the "recipe" section.  once the recipe is correct: click the "save" icon at the top (the floppy disc icon), and then select the "compact json" tab. This is the compact-json representation of this recipe. You then need to convert that json string into a base64-encoded string (using the CyberChef GUI and the ToBase64 operation), and use the result for this field.
(This process is a little convoluted, but Splunk can't handle json in SPL, so this workaround is required. Look at the **recipe** parameter below as another alternative).

For example, if you wanted a recipe to convert a string from base64 and then generate the SHA2 hash, you would build this recipe in the CyberChef GUI, click the "save" button, click on the "compact json" tab to get the following recipe in compact json format:
```
[{"op":"From Base64","args":["A-Za-z0-9+/=",true]},{"op":"SHA3","args":["512"]}]
```

Next: You need to convert this json string into a base64 encoded string (using cyberchef's toBase64 function in the GUI). This gives us the follwoing string:
```
W3sib3AiOiJGcm9tIEJhc2U2NCIsImFyZ3MiOlsiQS1aYS16MC05Ky89Iix0cnVlXX0seyJvcCI6IlNIQTMiLCJhcmdzIjpbIjUxMiJdfV0=
```

that string is now the value for the **b64recipe** parameter:
```
... | cyberchef infield = 'inData' b64recipe = "W3sib3AiOiJGcm9tIEJhc2U2NCIsImFyZ3MiOlsiQS1aYS16MC05Ky89Iix0cnVlXX0seyJvcCI6IlNIQTMiLCJhcmdzIjpbIjUxMiJdfV0=" |...
```

 ## **recipe** parameter
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

## **outfield** parameter
This optional parameter specifies which field to write the results of the CyberChef operation or recipe to.  If you don't specify this field, then the results will be written back to the field specified by the **infield** parameter.  You can specify an existing or new field with this paramter. If the field already exists, the value will be overwritten with the results. If the field does not exist, it will be created in your results.  If CyberChef is not able to process the data in your infield (say you tried to apply an invalid operation to your data), the outfield will be blank for that event.

# Notes
**Performance:**: While you could chain cyberchef operations together rather than using recipes like this:
```
... | cyberchef infield='x' operation='fromBase64" | cyberchef infield='x' operation='SHA3'  |  ...
```
You should avoid this when possible since there is a performance impact for this. Each time you run the cyberchef custom search command: there is a delay as the libraries are loaded (twice in the above example).  It will be much more efficent to use one of the other **recipe** parameters rather than the **operation** parameter multiple times.  Once the cyberchef libraries are loaded for a command, the processing tends to be relatively fast.

**Quotes:** This command should be able to handle most types of quotes for field names (infield and outfield).  If your field name starts with an alphabet character (a-zA-Z) and only has alphanumeric characters (\\w), you don't need to quote it.  If your fieldname contains spaces, cololons, or periods, or doesn't start with an alphabet character, enclose it in single or double quotes.  No other characters are permitted in the field names.

For the **b64recipe** parameter, you don't need quotes (but they wont hurt).

For the **recipe** and **command** parameters, if the name is only alphanumeric (\\w), you don't need quotes.  If you have any other characters or spaces, you should enclose the string in single or double-quotes. Double-quotes in the string must be escaped with a backslash.

**Unicode:** 
All parameters passed on the command line must be characters from the Basic Latin character set (no funny characters). Your data can have Unicode characters, although there may be issues when processing data that  newlines.

**CyberChef Operation Names**
CyberChef is really flexible about how you specify the **operation** name with regard to case sensitivity and spaces. All of the following work fine when specifying the **operation**:
ToBase64, toBase64, tOBaSe64, "to base 64", "to Base64", "toB ase 64".  Essentially CyberChef ignores case and spaces when determining the command you want. If you include spaces, quote the operation. Don't include the parenthesis for the operation.  Unfortunately you can't specify any paramemters for the operation (use a recipe or b64recipe if you require that). This is due to a way that Splunk parses the SPL before sending it to the custom search command. 

**CyberChef Operations**
This App should support all CyberChef operations offered by the [CyberChef node.js API](https://github.com/gchq/CyberChef/wiki/Node-API), which exclude only a [few commands](https://github.com/gchq/CyberChef/wiki/Node-API#excluded-operations).  This App uses Splunk's version of node (8.16), which isn't officially supported by CyberChef, but all the CyberChef unit tests passed, so there shouldn't be any problem running any of the supported CyberChef operations.

# Support
Please submit bug and feature requests via [Github](https://github.com/NDietrich/CyberChef-for-Splunk/issues), or email Noah@SublimeRobots.com.  Please include as much information as possible with your request.  This App is not professionally supported (it is a volunteer project), so issues may not be fixed immediately, but I will make every effort to reply.

This app implements version 2 of Splunk's custom search protocol manually (since there's no SDK for node.js), which I had to reverse-engineer with limited documentation.  Therefore, there are very likely some edge cases that you will run into that need to be fixed.  Please submit them via github with as much information as possible (that will allow me to easily re-create and fix the issue).

Future releases of this App will focus on bug-fixes and performance (since it's not effectively leveraging node's asynchronous functionality effectively).