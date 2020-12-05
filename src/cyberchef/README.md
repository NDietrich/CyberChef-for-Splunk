# CyberChef for Splunk
This Splunk App provides a Custom Search Command named **cyberchef** that allows you to apply [CyberChef](https://github.com/gchq/CyberChef) operations and recipes to your events.  This App also provides a local version of the CyberChef web GUI.

## Quick Example:
```
| makeresults count=3 
 | streamstats count
 | eval data=random()/random() 
 | cyberchef infield='data' outfield='convertedData' operation="ToBase64" 
 | table data convertedData
```
When you run the above example, you'll get something like the following output:

data                        | convertedData
--------------------------- | ------------------
1.267541990694              | MS4yNjc1NDE5OTA2OTQ=
1.233951602074389	          | MS4yMzM5NTE2MDIwNzQzODk=
1.738851991598791	          | MS43Mzg4NTE5OTE1OTg3OTE=

Here we generate three results with random data in the *'data'* field (the first three lines of SPL). We then use CyberChef's **toBase64** operation to convert the values in the *'data'* field into base-64 representation, and save the results to the *'convertedData'* field. Finally, we display the data in a table.

# Installation
You should install this App on all your Splunk Indexers and Search Heads (there is no benefit or harm to installing it on any forwarders).  You must reboot Splunk after installation. No configuration is required to use this App.

This App runs on Windows and Linux, and works with Splunk versions 7.3 - 8.1.

# Usage
This App will allow you to apply CyberChef operations and recipes through a custom search command named **cyberchef**.  This custom search command requires that you specify the input field to operate on, the CyberChef operation or recipe to apply to the data in that field, and optionally a different output field to write the results to.

In the simplest usage: the following SPL will apply the "toBase64" operation to the "inData" field, and save the results back to the "inData" field (overwriting the original field).
```
... | cyberchef infield='inData' operation="ToBase64" |...
```

There are four ways to specify the CyberChef operation or recipe to use. You must choose one of these parameters:
1. **operation**:  A single operation with no parameters.
2. **jsonRecipe**: A recipe saved as compact json.
3. **encodedRecipe**:  A recipe saved as compact json, then converted to base64.   
4. **savedRecipe**:  A recipe in saved as compact json, saved to a text file located in this App's *./local/recipes/* folder.

A CyberChef **operation** is a single function applied to the specified field for each event from your data. For example: converting data from a base64-encoded string using the *FromBase64* operation.

A CyberChef **recipe** is one or more operations chained together, where each operation can have optional parameters.  For example: converting data into a base64-encoded string (using the *ToBase64* operation), and then calculating the SHA3 hash with an output size of 256 of that base64 encoded data using the *SHA3* operation with the 256 output-size option.

Recipes (versus an operation) must be formatted in CyberChef's compact json format (more information below), which can be done through the CyberChef web GUI.

Please make sure to read the section below titled **Charsets, Quotes, and Escaped Characters** and **Parameter ordering** before you try to use this app to avoid errors, as parameter ordering is important.

## **operation** parameter
This is the simplest method, and allows you to apply a single CyberChef operation without any parameters.

From the CyberChef node.js API documentation:  *Operation names are camelCase versions of the operations on the web app, except for when the operation name begins with more than one uppercase character. For example, "Zlib Deflate" becomes zlibDeflate, but "SHA2" stays as SHA2.*  That being said: this App's implementation of CyberChef is really flexible with naming, see the section below **CyberChef Operation Names**.

```
... | cyberchef infield='inData' operation="ToBase64" |...
```

If you want to save the results to a different (or newly created field), include the 'outfield' parameter:
```
... | cyberchef infield='inData' outfield=outData operation="ToBase64" |...
```

## **jsonRecipe** parameter
If you need to use multiple operations (a recipe), or your operations require non-default parameters, you can't use the **operation** parameter. One way to solve this is with the **jsonRecipe** parameter. This allows you to specify a complete recipe in your SPL command.  The recipe is formated in compact-json.

To create this json string: From the CyberChef GUI, construct your recipe by dragging the operations you want to the "recipe" section.  Once the recipe is correct: click the "save" icon at the top (the floppy disc icon), and then select the "compact json" tab. This is the compact-json representation of this recipe, and is what to use for this parameter.

An example:
```
... | cyberchef infield='inData' outfield="outData" jsonRecipe="[{"op":"To Base64","args":["A-Za-z0-9+/="]}]" |...
```

## **encodedRecipe** parameter
This is similar to the **jsonRecipe** paraemter, except the recipe is encoded in base64 format (this is helpful if you have parameters in your recipe that aren't part of the ASCII character set).

To create this base64 string: Just like above, From the CyberChef GUI, construct your recipe by dragging the operations you want to the "recipe" section.  once the recipe is correct: click the "save" icon at the top (the floppy disc icon), and then select the "compact json" tab. This is the compact-json representation of this recipe. You then need to convert that json string into a base64-encoded string (using the CyberChef GUI and the ToBase64 operation), and use the result for this field.

For example, if you wanted a recipe to convert a string from base64 and then generate the SHA2 hash, you would build this recipe in the CyberChef GUI, click the "save" button, click on the "compact json" tab to get the following recipe in compact json format:
```
[{"op":"From Base64","args":["A-Za-z0-9+/=",true]},{"op":"SHA3","args":["512"]}]
```

Next: You need to convert this json string into a base64 encoded string (using CyberChef's toBase64 function in the GUI). This gives us the following string:
```
W3sib3AiOiJGcm9tIEJhc2U2NCIsImFyZ3MiOlsiQS1aYS16MC05Ky89Iix0cnVlXX0seyJvcCI6IlNIQTMiLCJhcmdzIjpbIjUxMiJdfV0=
```

that string is now the value for the **encodedRecipe** parameter:
```
... | cyberchef infield = 'inData' encodedrecipe = "W3sib3AiOiJGcm9tIEJhc2U2NCIsImFyZ3MiOlsiQS1aYS16MC05Ky89Iix0cnVlXX0seyJvcCI6IlNIQTMiLCJhcmdzIjpbIjUxMiJdfV0=" |...
```

## **savedRecipe** parameter
If you find yourself using the same recipes over and over, you can save them in this App's "./local/recipe" folder with a nickname to easily reference them. 

first create a *./local/recipe/myRecipes.txt* text file.  In this file, add the following content:
```
# Comment: the line below is a recipe you can reference from the CyberChef custom search command
myComplexRecipe  :  [{"op":"SHA3","args":["512"]}]

```

You don't need to reboot Splunk to use these recipes, but you need to make sure the recipe is avaliable on all your Splunk servers. Run the following SPL to reference this recipe:
```
... | cyberchef infield = 'inData' recipe = "myComplexRecipe" |...
```

To test this, I have made two savedRecipe examples avaliable. The First coverts the event to moorse code:
```
... | cyberchef infield='inData' recipe=example_moorse  |...
```

the second example converts the event to to base64, then to moorse code:
```
... | cyberchef infield='inData' recipe=example_xml_moorse  |...
```

You can have as many text files you want, with as many saved recipes as you want.  This App will parse all text files in the *./local/recipe/* folder for recipes.  The first matching recipe name will be used.

See the [./default/recipes/READEME.txt](./default/recipes/READEME.txt) file included with this App for more details.

## **outfield** parameter
This optional parameter specifies which field to write the results of the CyberChef operation or recipe to.  If you don't specify this field, then the results will be written back to the field specified by the **infield** parameter.  You can specify an existing or new field with this parameter. If the field already exists, the value will be overwritten with the results. If the field does not exist, it will be created in your results.  If CyberChef is not able to process the data in your infield (say you tried to apply an invalid operation to your data), the outfield will be blank for that event.
```
... | cyberchef infield='inData' outfield='modifiedData' operation="ToBase64" |...
```

## **Debug** parameter
This optional parameter can either be set to **full** for full debug information (including the contennt of messages passed between splunk and this app, including the data from your events), or to **info** for the same information, excluding the actual data sent and received.  The debug information is saved to a file named **cyberchef.log** in the search's dispatch directory.  If you have a problem and are requesting assitance, you'll probably want to include the debug log.
```
... | cyberchef infield='inData' debug=full operation="ToBase64" |...
... | cyberchef infield='inData' debug=info outfield='modifiedData' operation="ToBase64" |...
```

# Important Notes
**Parameter Ordering**
You must start with the **infield** parameter, followed by the optional **outfield** and **debug** parameters. You must end with one of the four recipe/operation parameters listed above.  If you don't follow this order, you will get an error (this ordering makes it easier to parse the SPL and minimizes the number of characters you need to escape in your SPL).

**Charsets, Quotes, and Escaped Characters**
This command only supports the ASCII characterset in the SPL (but can support any Unicode characters in your data). What this means is that your fieldnames and your recipes must be ASCII chars; essentially if you type it in as SPL, it must be ASCII. If you have non-ASCII characters in your json or recipe, you can either use the **encodedreipce** or **savedrecipe** option to run the command. 

This command should be able to handle most types of quotes for field names (infield and outfield).  If your field name only has alphanumeric characters (the \\w character set), you don't need to quote it, otherwise use single-quotes for your field names.  For fieldnames, you must escape the single-quote and the pipe character.  For example, if you have a field named **a|b**, and you wanted to save the output to a field named **b 'or' a**, your command would be:
```
... | cyberchef infield='a\|b' outfield='b \'or\' a' ...
```

For the **encodedRecipe** parameter, you don't need quotes (but they won't hurt).

For the **savedRecipe** and **command** parameters, if the name is only alphanumeric (\\w), you don't need quotes.  If you have any other characters or spaces, you should enclose the string in single or double-quotes. The Pipe in the string must be escaped with a backslash.

Basically: when in doubt, use single-quotes. Fieldnames need the single quote and pipe escaped with a backslash, and the command you use only needs the pipe escaped.

**CyberChef Operation Names**
CyberChef is really flexible about how you specify the **operation** name with regard to case sensitivity and spaces. All of the following work fine when specifying the **operation**:

ToBase64, toBase64, tOBaSe64, "to base 64", "to Base64", "toB ase 64".  

Essentially CyberChef ignores case and spaces when determining the command you want. If you include spaces, quote the operation. Don't include the parenthesis for the operation.  Unfortunately you can't specify any parameters for the operation (use a recipe or encodedRecipe if you require that). This is due to a way that Splunk parses the SPL before sending it to the custom search command. 

**CyberChef Operations**
This App should support all CyberChef operations offered by the [CyberChef node.js API](https://github.com/gchq/CyberChef/wiki/Node-API), which exclude only a [few commands](https://github.com/gchq/CyberChef/wiki/Node-API#excluded-operations).  This App uses Splunk's version of node (8.16), which isn't officially supported by CyberChef, but all the CyberChef unit tests passed, so there shouldn't be any problem running any of the supported CyberChef operations.

**Performance:** While you could chain multiple CyberChef operations together like this:
```
... | cyberchef infield='x' operation='fromBase64" | cyberchef infield='x' operation='SHA3'  |  ...
```
You should avoid this when possible since there is a performance impact. Each time you run the cyberchef custom search command: there is a delay as the libraries are loaded (twice in the above example).  It will be much more efficent to use one of the other **recipe** parameters rather than the **operation** parameter multiple times.  Once the CyberChef libraries are loaded for a command, the processing tends to be relatively fast.

# CyberChef Web GUI
This App provides a local version of the CyberChef Web GUI. It can be found by opening the App in Splunk Web, and clicking the link in the Nav Bar for CyberChef.

# Support
Please submit bug and feature requests via [Github](https://github.com/NDietrich/CyberChef-for-Splunk/issues), or email Noah@SublimeRobots.com.  Please include as much information as possible with your request.  This App is not professionally supported (it is a volunteer project), so issues may not be fixed immediately, but I will make every effort to reply.

This app implements version 2 of Splunk's custom search protocol manually (since there's no SDK for node.js), which I had to reverse-engineer with limited documentation.  Therefore, there are very likely some edge cases that you will run into that need to be fixed.  Please submit them via Github with as much information as possible (that will allow me to easily re-create and fix the issue).

Future releases of this App will focus on bug-fixes and performance (since it's not effectively leveraging node's asynchronous functionality effectively).

# License
This App is released under the GPL v3 license. Please see the [LICENSE](./LICENSE-GPL_v3) file.  CyberChef is released under the [Apache 2.0 License](./LICENSE-Apache_v2.0) and is covered by [Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/copyright-and-re-use/crown-copyright/).  This App has no affiliation with CyberChef or GCHQ, it merely implements their open-source software. 

# Binary File Declaration
Splunk AppInspect reqiures the following statement:
This app includes one webassembly (WASM) binary file: **bin/node_modules/tesseract.js-core/tesseract-core.wasm**. This file is installed as a part of the required [Tesseract](https://www.npmjs.com/package/tesseract) npm library. The source code for this binary file is included in the same directory (tesseract-core.wasm.js) and instructions are in the README.md.txt file.