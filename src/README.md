# Notes on building Splunk App and required software

Building the components of this app from scratch have a few unique challenges.
If you're building a new version of CyberChef, you have to  build both the webpage and the node.js API. The Webpage needs some modifications to work within Splunk.
If you're modifyign the SPL parameters this app uses, you need to modify the nearly grammer and re-compile the grammer.js file.

# Modifying this TA
If you want to make modifications to a git-clone of this repository, you can use the makefile located in the src folder of this repo to generate your own .spl file (the TA archived into a single file).  This makefile has a few different options:

- **clean:** Remove all temp working directories and created .spl files 
- **spl:** Default option. creates the .spl file in this directory, ready for submission to Splunkbase.
- **install:** Same as above, but then extract the TA to the location specified by the APPDIR variable. (install this TA on your local Splunk server for testing). Reboot Splunk server first.      
- **local-spl:** Same as SPL, but don't remove the contents of the 'local' folder. For internal testing.
- **local-install:** Same as 'install', but doesn't remove the contents of the 'local' folder, for testing.

To verify the TA .spl file is valid, you can use Splunk's [AppInspect](http://dev.splunk.com/view/appinspect/SP-CAAAFAM) tool.  

Once you've created the spl file, you can upload it to your Splunk Server through the [web interface](https://docs.splunk.com/Documentation/AddOns/released/Overview/Singleserverinstall), through your deployment server (if using), through the [CLI](https://docs.splunk.com/Documentation/Splunk/latest/Admin/Managingappobjects#Update_an_app_or_add-on_in_the_CLI), or by just extracting the .spl file into the app directory on your server ($SPLUNK_HOME/etc/apps/).  This last option is how the 'install' and 'local-install' MAKE targets work.  An overview of deployment options is [available](https://docs.splunk.com/Documentation/Splunk/8.1.0/Admin/Deployappsandadd-ons).

# Building CyberChef
```
sudo npm install -g grunt-cli

git clone https://github.com/gchq/CyberChef.git
cd CyberChef
npm install

# Build creates html file (multi-platform)
grunt prod	

# create node module
grunt node
# note: compiles in place (not in prod)
```

alternately:
```
cd ~/
npm install --save ./CyberChef/

test:
// app.js
const chef = require("cyberchef");

console.log(chef.fromBase64("U28gbG9uZyBhbmQgdGhhbmtzIGZvciBhbGwgdGhlIGZpc2gu"));

// node app.js
// => "So long and thanks for all the fish."


```



## Nearley Grammar
To compile the .js file from the nearly grammar:

```
node.exe nearleyc.js grammar.ne -o grammar.js
```
save the grammar.js to the app's 'bin' directory
