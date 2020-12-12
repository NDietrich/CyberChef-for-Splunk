# Notes on building Splunk App and required software

Building the components of this app from scratch have a few unique challenges.
If you're building a new version of CyberChef, you have to  build both the webpage and the node.js API. The Webpage needs some modifications to work within Splunk.
If you're modifyign the SPL parameters this app uses, you need to modify the nearly grammer and re-compile the grammer.js file.

# Modifying this App
If you want to make modifications to a git-clone of this repository, you can use the makefile located in the src folder of this repo to generate your own .spl file (the App archived into a single file).  This makefile has a few different options:

- **clean:** Remove all temp working directories and created .spl files 
- **spl:** Default option. creates the .spl file in this directory, ready for submission to Splunkbase.
- **install:** Same as above, but then extract the App to the location specified by the APPDIR variable. (install this App on your local Splunk server for testing). Reboot Splunk server first.      
- **local-spl:** Same as SPL, but don't remove the contents of the 'local' folder. For internal testing.
- **local-install:** Same as 'install', but doesn't remove the contents of the 'local' folder, for testing.

To verify the .spl file is valid, you can use Splunk's [AppInspect](http://dev.splunk.com/view/appinspect/SP-CAAAFAM) tool.  

Once you've created the spl file, you can upload it to your Splunk Server through the [web interface](https://docs.splunk.com/Documentation/AddOns/released/Overview/Singleserverinstall), through your deployment server (if using), through the [CLI](https://docs.splunk.com/Documentation/Splunk/latest/Admin/Managingappobjects#Update_an_app_or_add-on_in_the_CLI), or by just extracting the .spl file into the app directory on your server ($SPLUNK_HOME/etc/apps/).  This last option is how the 'install' and 'local-install' MAKE targets work.  An overview of deployment options is [available](https://docs.splunk.com/Documentation/Splunk/8.1.0/Admin/Deployappsandadd-ons).

# Building CyberChef for this App
CyberChef is used two ways in this app: 
1. The node.js API used by the app itself.
2. The local version of the CyberChef web gui.

## Steps to install the correct node packages
This App uses four npm packages, which are listed in the **./bin/packages.json** file:
```
	"dependencies": {
		"cyberchef": "^9.21.0",
		"csv-parse": "^4.14.1",
		"csv-stringify": "^5.4.0",
		"stream-transform": "^2.0.3",
		"nearley": "^2.19.9"
	}
```
if you delete **./bin/node_modules** folder, just run **npm install** from the **./bin** folder to install these files. use the Makefile (build spl command) to clean up the build folder before use.

## testing with Splunk's AppInspect:
instructions for validating the .spl file on an Ubuntu 20 system:

```
sudo apt-get install -y libxml2-dev libxslt-dev lib32z1-dev python-lxml
sudo apt-get install python3-pip 
sudo apt install python3-testresources
sudo pip3 install --upgrade pip setuptools

sudo apt-get install libmagic-dev
wget https://download.splunk.com/misc/appinspect/splunk-appinspect-latest.tar.gz 
sudo pip3 install splunk-appinspect-latest.tar.gz --ignore-installed PyYAML
```

and finally test the .spl file:
```
splunk-appinspect inspect cyberchef.spl --mode test --included-tags cloud
```


# Building the CyberChef Web Page
```
git clone https://github.com/gchq/CyberChef.git
cd CyberChef
npm install grunt-cli

npm install

# create html file 
grunt prod	
```

After this completes, the webpage (website actually) is located under **./build/prod/**, and can be launched by opening **./build/prod/index.html**.  Thie prod folder also includes a zip file of the entire website.  You need to add this line at the top of the CyberChef.html file for it to launch within Splunk Web:
```
<script src="../../js/i18n.js" />
```

Copy the contents of the **prod** folder (except the zip file) to this app's **./appserver/static** folder, and reference it in this apps **/default/data/ui/nav/default.xml** file as follows:
```
...
<nav search_view="search">
  ...
  <a href="/static/app/cyberchef/CyberChef.html"  target="_blank">CyberChef</a>
</nav>
...
```

Optional (not used in this app): create node module manually.  Compiles in place (not in prod)
```
grunt node

# and test the node file using splunk's enviornment and node interpreter
source /opt/splunk/bin/setSplunkEnv
grunt test

```

Test that CyberChef Node API works:
```
test:
// app.js
const chef = require("cyberchef");

console.log(chef.fromBase64("U28gbG9uZyBhbmQgdGhhbmtzIGZvciBhbGwgdGhlIGZpc2gu"));

// node app.js
// => "So long and thanks for all the fish."
```

# Testing CyberChef without Grunt
you can test cyberchef by running the following commands (taken from the gruntfile), you're probably using the latest version of NPM and node (not splunk's older version, but that's ok):
```
npm install cyberchef
npm install cyberchef --only=dev
npm install cli-progress

cd node_modules/cyberchef/

node --experimental-modules --no-warnings --no-deprecation tests/node/index.mjs && node --experimental-modules --no-warnings --no-deprecation tests/operations/index.mjs
```

and then to test with Splunk's version of Node:
```
source /opt/splunk/bin/setSplunkEnv
node -v
     v8.17.0
which node
     /opt/splunk/bin/node

node --experimental-modules --no-warnings --no-deprecation tests/node/index.mjs && node --experimental-modules --no-warnings --no-deprecation tests/operations/index.mjs

```


## Nearley Grammar
To compile the .js file from the nearly grammar:

```
node.exe nearleyc.js grammar.ne -o grammar.js
```
save the grammar.js to the app's 'bin' directory
