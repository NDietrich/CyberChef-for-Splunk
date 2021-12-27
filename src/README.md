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
This App uses five npm packages, which are listed in the **./bin/packages.json** file:
```javascript
	"dependencies": {
		"csv-parse": "^4.14.1",
		"csv-stringify": "~5.4.0",
		"cyberchef": "^9.23.3",
		"nearley": "^2.19.9",
		"stream-transform": "^2.0.3"
	}
```

## Building CyberChef
There is currently a bug with CyberChef [#1166](https://github.com/gchq/CyberChef/issues/1166) and [#1227](https://github.com/gchq/CyberChef/issues/1127) which prevent `npm install` from working.  To install the node libraries, you need to navigate into the 'bin' folder (where the package) and run:
```
rm package-lock.json
npm install --production=true --force
```

then we do a lot of cleanup to reduce the size of the node modules folder:
```
npm prune --production

# get rid of readme files with the node-prune project 
# one exception tesseract's README.md since it has compilation instructions for the WASM file (required by appinspect)
mv ./node_modules/tesseract.js-core/README.md ./node_modules/tesseract.js-core/README.md.txt

npm install node-prune -g
node-prune

# Remove swf file (so the app will pass appinspect)
rm ./node_modules/node-forge/flash/swf/SocketPool.swf 

# remove some oversized files and folders that aren't needed by the node api:
rm -rf ./node_modules/image-q/demo
rm ./node_modules/tesseract/lang-data/eng.traineddata.gz
rm ./node_modules/cyberchef/src/core/vendor/tesseract/lang-data/eng.traineddata.gz
```

finally run a simple test to make sure cyberchef node api works. create a test.js file in your bin folder, with the following content:
```
const chef = require('cyberchef')
console.log(chef.fromBase64("U28gbG9uZyBhbmQgdGhhbmtzIGZvciBhbGwgdGhlIGZpc2gu"));
//output will be "So long and thanks for all the fish."
```

run this with `node test.js` (or explicity use the splunk node engine in the SPLUNK_HOME's bin folder)


## Manudally download and install CyberChef 
This is required to build the web interface (webpage), and is convoluted due to a few bugs and devDependencies.

```
mkdir ~/cyberchef-test
cd ~/cyberchef-test
git clone https://github.com/gchq/CyberChef.git
```

Now we have to edit the Gruntfile.js file due to a bug. We add this code to the last section: **fixCryptoApiImports**: 
```
	options: {
        shell: "/bin/bash"
    }, 
```

Some housekeeping:
```
cd ~/cyberchef-test/CyberChef
rm .*
rm -rf .git
rm -rf .github
rm package-lock.json
rm -rf node_modules
```

modify source to remove all Vigenère and replace with Vigenere, because when we tar the folder, untar on windows can't handle the unicode.
```
cd ~/cyberchef-test/CyberChef
sed -i -e 's/Vigenère/Vigenere/g' $(find ./ -type f)
mv ~/cyberchef-test/CyberChef/src/core/operations/VigenèreDecode.mjs ~/cyberchef-test/CyberChef/src/core/operations/VigenereDecode.mjs 
mv ~/cyberchef-test/CyberChef/src/core/operations/VigenèreEncode.mjs ~/cyberchef-test/CyberChef/src/core/operations/VigenereEncode.mjs 
```



install pre-requisites, then build cyberchef node modules. then cleanup:
```
cd ~/cyberchef-test/CyberChef
npm install grunt
npm install --production=false
npm prune --production 
```


Finally test your install as above. 




## testing with Splunk's AppInspect:
instructions for validating the .spl file on an Ubuntu 20 system:

```
sudo apt-get install python3-pip 

sudo apt-get install libmagic-dev
wget https://download.splunk.com/misc/appinspect/splunk-appinspect-latest.tar.gz 
sudo pip3 install splunk-appinspect-latest.tar.gz --ignore-installed PyYAML
```

and finally test the .spl file:
```
splunk-appinspect inspect cyberchef.spl --mode test --included-tags cloud
```


# Building the CyberChef Web Page
(must be done on linux, due to line-endings)
```
sudo npm install grunt grunt-cli -g

git clone https://github.com/gchq/CyberChef.git
cd CyberChef
```

Fix the crypto imports as above. finally install the required node packages
```
npm install
```

Next, modify the source to remove all Vigenère and replace with Vigenere, because when we tar the folder, untar on windows can't handle the unicode.
```
find ./ -type f -exec sed -i -e 's/Vigenère/Vigenere/g' {} \;
mv ./src/core/operations/VigenèreDecode.mjs ./src/core/operations/VigenereDecode.mjs 
mv ./src/core/operations/VigenèreEncode.mjs ./src/core/operations/VigenereEncode.mjs 
```

Finally use grunt to build
```
# create html file 
grunt prod	
```

After this completes, the webpage (website actually) is located under **./build/prod/**, and can be launched by opening **./build/prod/index.html**.  Thie prod folder also includes a zip file of the entire website.  

rename index.html as CyberChef.html.

modify CyberChef.html to add the following line at the top of the file for it to launch within Splunk Web:
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


## Nearley Grammar
The [nearley](https://nearley.js.org/) grammar is used to parse the SPL args for the cyberchef custom search command that are passed by Splunk to the command.  To compile the .js file from the nearly grammar:

```
node.exe nearleyc.js grammar.ne -o grammar.js
```
save the grammar.js to the app's 'bin' directory
