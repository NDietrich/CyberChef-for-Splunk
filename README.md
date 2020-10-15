# Overview
This repository is for the "CyberChef for Splunk" App for Splunk.  This Splunk App provides a Custom Search Command for [CyberChef](https://gchq.github.io/CyberChef/) [node api](https://github.com/gchq/CyberChef/wiki/Node-API), allowing you to apply CyberChef operations and complex recipes to your search results.

A CyberChef operation is a single modification of your data, for example converting data from a base64-encoded string using the *FromBase64* operation.  A reipce is one or more operations, each with optional parameters and settings, chained together.  For example: converting data into a base64-encoded string (using the *ToBase64* operation), and then calcuating the SHA3 hash with an output size of 256 of that base64 encoded data using the *SHA3* operation with the 256 option.

Reipces must be formated in compact json format (more information below), which can be done through the CyberChef GUI.

This TA is released under the GPL v3 license. Please see the [LICENSE](./TA_Snort3_json/LICENSE) file.

This TA can be installed directly from [SplunkBase](https://splunkbase.splunk.com/), or you can use this repository to modify and create a stand-alone version of this App, or [download the TA](https://github.com/NDietrich/CyberChef-for-Splunk/releases) and install manually. You only need to use this repository if you want to modify the TA yourself, or if you don't want to download the plugin from Splunk directly. In most cases, you should download this TA directly from [SplunkBase](https://splunkbase.splunk.com/) via your local Splunk instance.

# Installing This App
No configuration is required to use this App after installation. You should install this App on all your indexers and search heads (there is no benefit or harm to installing it on any forwarders).

# Using this App
This App will allow you to apply CyberChef operations and recipes on your data.  This custom search command requires that you specify the input field to opereate on, the CyberChef function or recipe to apply to the data in that field, and optionally a different output field to write the results to.

In the simplest usage: the following SPL will apply the "toBase64" operation to the "inData" field, and save the results back to the "inData" field (overwriting the original field).
```
... | cyberchef infield = 'inData' operation = "ToBase64" |...
```

There are three options for specifying the CyberChef operations or recipes:
(1) *operation*:  A single operation with no parameters.
(2) *b64recipe*:  A recipe (collection of one or more operations with options) saved as compact json, then converted to base64.    
(3) *recipe*:  A recipe in (collection of one or more operations with options) saved as compact json, saved to this Apps *./local/recipes* folder.

You must choose one of the above options when running this command.  See below for specific examples.

## operation
This is the simplest method, and allows you to apply a single CyberChef operation without any parameters.

Operation names are camelCase versions of the operations on the web app, except for when the operation name begins with more than one uppercase character. For example, "Zlib Deflate" becomes zlibDeflate, but "SHA2" stays as SHA2.

```
... | cyberchef infield = 'inData' operation = "ToBase64" |...
```

if you want to save the results to a differnt (or newly created field), include the 'outfield' option:
```
... | cyberchef infield = 'inData' outfield = "outData" operation = "ToBase64" |...
```


## b64recipe
If you need to use multiple operations (a recipe), or your operations require specific parameters, you can't use the *operation* option. One way to solve this is with the *b64recipe* option. This allows you to use a recipe in your SPL.  This is a base64-encoded representation of the recipe in compact-json form.  To create this string: from the CyberChef GUI, build your recipe. Click the "save" button, and then select the "compact json" tab. This is the compact-json representation of this entire recipe. You then need to convert that compact-json into a base64-encoded string (using the CyberChef GUI), and use the result for this field.
(It is a little convoluted, but Splunk can't handle json in the SPL, so this workaround is required. Look at the *recipe* option below as another alternative).

for example, if you wanted to convert a string from base64 and then generate the SHA2 hash, you would build this recipe in the CyberChef Gui, click the "save" button, click on the "compact json" tab to get the following recipe in compact json format:
```
[{"op":"From Base64","args":["A-Za-z0-9+/=",true]},{"op":"SHA3","args":["512"]}]
```

you need to convert this string into a base64 encoded string (using cyberchef's toBase64 function in the GUI). This gives us the follwoing string:
```
W3sib3AiOiJGcm9tIEJhc2U2NCIsImFyZ3MiOlsiQS1aYS16MC05Ky89Iix0cnVlXX0seyJvcCI6IlNIQTMiLCJhcmdzIjpbIjUxMiJdfV0=
```
that string is now the *b64recipe* option:
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
you don't need to reboot Splunk. Run the follwoing SPL to reference this recipe:
```
... | cyberchef infield = 'inData' recipe = "myComplexRecipe" |...
```

See the [./default/recipes/READEME.txt](./default/recipes/READEME.txt) file for more details.



# Modifying this TA
If you want to make modifications to a git-clone of this repository, you can use the makefile located in the src folder of this repo to generate your own .spl file (the TA archived into a single file).  This makefile has a few different options:

- **clean:** Remove all temp working directories and created .spl files 
- **spl:** Default option. creates the .spl file in this directory, ready for submission to Splunkbase.
- **install:** Same as above, but then extract the TA to the location specified by the APPDIR variable. (install this TA on your local Splunk server for testing). Reboot Splunk server first.      
- **local-spl:** Same as SPL, but don't remove the contents of the 'local' folder. For internal testing.
- **local-install:** Same as 'install', but doesn't remove the contents of the 'local' folder, for testing.

To verify the TA .spl file is valid, you can use Splunk's [AppInspect](http://dev.splunk.com/view/appinspect/SP-CAAAFAM) tool.  

Once you've created the spl file, you can upload it to your Splunk Server through the [web interface](https://docs.splunk.com/Documentation/AddOns/released/Overview/Singleserverinstall), through your deployment server (if using), through the [CLI](https://docs.splunk.com/Documentation/Splunk/latest/Admin/Managingappobjects#Update_an_app_or_add-on_in_the_CLI), or by just copying the .spl file into the app directory on your server ($SPLUNK_HOME/etc/apps/).  This last option is how the 'install' and 'local-install' MAKE targets work.  An overview of deployment options is [available](https://docs.splunk.com/Documentation/Splunk/7.2.1/Admin/Deployappsandadd-ons).


# Requesting Help
Please submit bug and feature requests via [Github](https://github.com/NDietrich/Splunk-Snort3-TA/issues) for this project, or email Noah@SublimeRobots.com.  Please include as much information as possible with your request.  This TA is not professionally supported (it is a volunteer project), so issues may not be fixed immediately, but I will make every effort to reply.