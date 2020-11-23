# Overview
This repository is for the "CyberChef for Splunk" App for Splunk.  This Splunk App provides a Custom Search Command (Search Processing Language) for the [CyberChef](https://gchq.github.io/CyberChef/) node [api](https://github.com/gchq/CyberChef/wiki/Node-API), allowing you to apply CyberChef operations and recipes to your search results.

# License
This App is released under the GPL v3 license. CyberChef is released under the Apache 2.0 License and is covered by Crown Copyright.

# Installing
In most instances: you will want to install this App on your Splunk servers directly from [SplunkBase](https://splunkbase.splunk.com/).  Alternately: you can [download](https://github.com/NDietrich/CyberChef-for-Splunk/releases) the App (in .spl format) from github to install manually on your servers.  If you want to modify this App: this repository has a [makefile](https://github.com/NDietrich/CyberChef-for-Splunk/blob/main/src/Makefile) that will build this App for you.  You only need to clone this repository if you want to modify the App yourself following these [instructions](https://github.com/NDietrich/CyberChef-for-Splunk/blob/main/src/README.md).

# Example:
```
| makeresults count=3 
 | streamstats count
 | eval data=random()/random() 
 | cyberchef infield='data' outfield='convertedData' operation="ToBase64" 
 | table data convertedData
```
When you run the above example, you'll get something like the following output:
```
data                        | convertedData
--------------------------- | ------------------
1.267541990694              | MS4yNjc1NDE5OTA2OTQ=
1.233951602074389	          | MS4yMzM5NTE2MDIwNzQzODk=
1.738851991598791	          | MS43Mzg4NTE5OTE1OTg3OTE=
```

This App has additional functionality. Please see the [instructions](https://github.com/NDietrich/CyberChef-for-Splunk/blob/main/src/cyberchef/README.md) using this App.

# Requesting Help
Please submit bug and feature requests via [Github](https://github.com/NDietrich/Splunk-Snort3-TA/issues) for this project, or email Noah@SublimeRobots.com.  Please include as much information as possible with your request.  This TA is not professionally supported (it is a volunteer project), so issues may not be fixed immediately, but I will make every effort to reply.
