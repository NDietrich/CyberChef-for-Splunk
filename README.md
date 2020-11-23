# Overview
This repository is for the "CyberChef for Splunk" App for Splunk.  This Splunk App provides a Custom Search Command (Search Processing Language) for the [CyberChef](https://gchq.github.io/CyberChef/) node [api](https://github.com/gchq/CyberChef/wiki/Node-API), allowing you to apply CyberChef operations and recipes to your search results.

# License
This App is released under the GPL v3 license. CyberChef is released under the Apache 2.0 License and is covered by Crown Copyright.

# Installing
For most instances, you will want to install this App on your Splunk servers directly from [SplunkBase](https://splunkbase.splunk.com/).  You can also download the App (in .spl format) from github if you prefer: [releases](https://github.com/NDietrich/CyberChef-for-Splunk/releases) and install manually.  If you want to modify this App, this repository has a [makefile](https://github.com/NDietrich/CyberChef-for-Splunk/blob/main/src/Makefile) to build this App.  You only need to clone this repository if you want to modify the App yourself. If you want to modify this app, please see these [instructions](https://github.com/NDietrich/CyberChef-for-Splunk/blob/main/src/README.md).

# Usage
Please see the [instructions](https://github.com/NDietrich/CyberChef-for-Splunk/blob/main/src/cyberchef/README.md) for using this App.

# Requesting Help
Please submit bug and feature requests via [Github](https://github.com/NDietrich/Splunk-Snort3-TA/issues) for this project, or email Noah@SublimeRobots.com.  Please include as much information as possible with your request.  This TA is not professionally supported (it is a volunteer project), so issues may not be fixed immediately, but I will make every effort to reply.
