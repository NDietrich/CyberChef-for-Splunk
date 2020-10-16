# Notes on building Splunk App and required software

Building the components of this app from scratch have a few unique challenges.
If you're building a new version of CyberChef, you have to  build both the webpage and the node.js API. The Webpage needs some modifications to work within Splunk.
If you're modifyign the SPL parameters this app uses, you need to modify the nearly grammer and re-compile the grammer.js file.



## CyberChef
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