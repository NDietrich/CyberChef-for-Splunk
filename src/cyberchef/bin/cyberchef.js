/*-------------------------------------------------------------------------------------------

						CyberChef for Splunk Custom Search Command


author: 	Noah Dietrich
contact:	noah@SublimeRobots.com

// OVERVIEW
This node.js script is the main part of the 'CyberChef for Splunk' App that provides a Custom Search Command 
(Search Processing Language) for the CyberChef node api, allowing you to apply CyberChef operations and recipes 
to your search results.

// LICENSE
This code is released under the GPL v3 License, while CyberChef is released under the Apache 2.0 License,
and is covered by Crown Copyright.

// ABOUT
This app implements version 2 of Splunk's custom search protocol manually (since there's no SDK for node.js), 
which I had to reverse-engineer with limited documentation. Therefore, there are very likely some edge cases 
that you will run into that need to be fixed. Please submit them via Github with as much information as possible 
(that will allow me to easily re-create and fix the issue).

If you're looking to implement your own Custom Search Command in javascript (leveraging node.js), or another 
language that isn't python (since there's a nice Splunk SDK for python), it's certainly possible (as this App proves).
That being said, it's a lot of work, and my recomendation would be to seriously consider sticking with python, since
the protocol isn't well documented (and Splunk doesn't make it easy to read from stdin, since not all messages end with a 
newline).  You also have to do a lot of work yourself parsing the input parameters, and crafting the correct message 
format to return.

// MORE ABOUT
if you're an expert in node.js, you'll find this code to be prety ugly.  This code is not properly leveraging node.js's 
asynchronous nature for the most part, and looks suspiciously like someone who came of age when c++ was the language 
of choice for computer science courses.   But it works, and that's the important part.

Future releases will implement node.js paradigms, as well as focus on performance increases (either by pre-loading the
cyberchef libraries, or by selectively loading only the required libraries for each command).

*/

/******************************************************************************
* 			load required libraries
******************************************************************************/
const fs = require('fs');		// write logfiles

// variables to hold required libraries (we'll load them later if needed)
var chef 		= null
var parse_csv	= null
var stringify	= null
var transform	= null


/******************************************************************************
* 			Global Variables
******************************************************************************/

var logfile = ''	// logfile location, defaults to dispatch_dir if not set explicity
					// If you're testing, set to a static path (c:\\debug.log or /tmp/debug.log)

var tempLogString	= ''		// string to hold logged messages until we determine if we're in debug mode

var searchOptions = null	// all the info from the getinfo json metatdata as a object
var message = null			// holds the received message (metadata and payload, not the header)

var metadataSize = null		// holds the size (from the header) of the metatdata
var payloadSize = null		// holds the size (from the header) of the payload

// the spl parameters passed from splunk
const spl_params = {				
	inputSearchField:		null,
	outputSearchField:		null,
	recipe:					null,
	operation:				null,
	b64recipe:				null,
	jsonRecipe:				null,
	debugEnabled:			'unknown',
}				



/******************************************************************************
* 			Functions that are command-specific
*
******************************************************************************/

/*************************************************
* build the json portion of our getinfo reply
*	
*
* return a string in json format
*/
const getinfo_reply = function(){
	log("Entering function 'getinfo_reply'.")

	// get the parameters passed by the user. Join to string, parse with nearley
	params = searchOptions.searchinfo.raw_args.join(' ') 
	log("The joined raw_args param string is: "  + params)

	// load nearley parser
	log("\tnearley parser as nearley")
	try{		
		nearley = require("nearley")
	} catch (err) {
		halt_on_error("Error loading required module 'nearley':  " + err.message + ", " + err.name)
	}

	// load the grammer that defines how to parse the input string
	try{
		var grammar = require("./grammar.js");
	} catch (err) {
		halt_on_error("Error loading required nearley grammar: " + err.message)
	}

	// parse the input string against our grammar
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
	try {
		parser.feed(params);
	} catch (err){
		log("Fatal Error trying to parse input options with nearley parser. The parser output is: \n" + err.message.split("\n",5 ).join("\n") + "\n" )
		halt_on_error("Error trying to parse input options. Please see cyberchef.log in this search's dispatch_dir for details. Error: " +  err.message.split("\n",1) )
	}
	
	var kvPairs = parser.results[0]

	// check which fields we received
	// we don't have to validate input, as the parser nicely does that for us.
	log("Evaluating KV Pairs from parser:")

	for(var i = 0; i < kvPairs.length; i++){
		for (const [key, value] of Object.entries(kvPairs[i])) {
			log ("\tKey: " + key + " ; Value: " + value)
			switch(key){
				case 'infield':
					spl_params.inputSearchField = value; break
				case 'outfield':
					spl_params.outputSearchField = value; break
				case 'savedrecipe':
					spl_params.recipe  = value.toLowerCase(); break
				case 'operation':
					spl_params.operation = value; break
				case 'encodedrecipe':
					spl_params.b64recipe = value; break
				case 'jsonRecipe':
					spl_params.jsonRecipe = value; break	
				case 'debug':
					spl_params.debugEnabled = value; //full or info 
					break
				default:
					// unknown option here
					halt_on_error("Error trying to parse input options. Unknown parameter received")
					break			
			}

		}
	}
	// if debug is not set at this point (still 'unknown'), set false
	if(spl_params.debugEnabled == 'unknown'){spl_params.debugEnabled = false}

	// if no outfield, then set it to the infield
	if (spl_params.outputSearchField == null){ spl_params.outputSearchField = spl_params.inputSearchField}
	
	log("Parsed spl_params are: " + JSON.stringify(spl_params))

	// get the required fields (infield and outfield) as an array of string(s)
	requiredFields = [spl_params.inputSearchField]

	if ((spl_params.outputSearchField != null ) && (spl_params.outputSearchField != spl_params.inputSearchField) ) {requiredFields.push( spl_params.outputSearchField)} 
	log("\tThe field(s) we are going to request Splunk send us are: " + requiredFields)

	// build reply as json string
	try {
		jsonReply = JSON.stringify({
			type 			: 'streaming',		
			required_fields : requiredFields,	
		 })
	} catch(err) { halt_on_error("Error building json getinfo metadata reply: " + err.message) }


	log("\tReturning string: " + jsonReply)
	log("Exiting function 'getinfo_reply'.")
	return jsonReply;

}

/*************************************************
* modify payload (csv data in a string)
*	
*
* @param {string}	data	string representation of csv data
*/
const modify_payload = function(data){
	log('Entering function modify_payload.')

	// convert data string to objects
	try {
		var events = parse_csv(data , {
			columns: true	// Infer the columns names from the first line.
		})
	} catch (err) {
		halt_on_error("Fatal Error in function modify_payload:  csv-parse error on payload: " + err.message)
	}

	log('\tNumber of events to process: ' + events.length)

	// Determine if we're running a simple operation, a complex recipe loaded from file, or a b64-encoded recipe
	var cmdToRun = ''	
	if(spl_params.operation != null){		
		cmdToRun = spl_params.operation
	} else if (spl_params.recipe != null) {
		try {
			cmdToRun = loadRecipesFromFile(spl_params.recipe)
			cmdToRun = JSON.parse(cmdToRun)
		} catch (err){
			halt_on_error("Error loading recipe from file, with recipe named "+ spl_params.recipe + ". Error:" + err.name)
		}
	} else if (spl_params.b64recipe != null) {
		try{
			cmdToRun = chef.bake(spl_params.b64recipe, 'FromBase64' )
		}catch (err){
			halt_on_error('Can not process b64-encoded string. Error: ' + err.message)
		}
		try {
			cmdToRun = JSON.parse(cmdToRun)
		} catch (err){
			halt_on_error("Fatal Error in function modify_payload: error during desearalize json from b64.  Error: " + err.name)
		}
	} else {
		try {
			cmdToRun = JSON.parse( spl_params.jsonRecipe)
		} catch (err){
			halt_on_error("Fatal Error in function modify_payload: error during desearalize json of jsonRecipe. Error:" + err.name)
		}
	}

	// Which Command did we finally choose to run?
	log("\tcyberchef command to run is: \n" + JSON.stringify(cmdToRun, null, "    ")   )

	// Iterate over each row of data and process with cyberchef
	const newrecords = transform(events, function(record){
		try {
			record[spl_params.outputSearchField] = (chef.bake( record[spl_params.inputSearchField] , cmdToRun)).toString()
		} catch (err) {
			halt_on_error("CyberChef " + err.message)
		}
	  	return record
	})

	log("\tDone processing records. " + newrecords.length +" records returned.")

	// convert objects back to csv string and save back to our message
	var modifiedData = null
	try {
		// will convert value to NaN if not passed an integer, or will round doubles down.
		modifiedData = stringify(newrecords, {header: true, quoted_string: true })
	} catch (err) {
		halt_on_error("Error converting results to CSV: " + err.message)
	}

	log('Exiting function modify_payload.')
	return modifiedData
}




/******************************************************************************
* 			Helper Functions
******************************************************************************/


/*************************************************
* Log a string to the local logfile 
*	
*
* @param {string}	msg	the message to log
*/
const log = function(msg){

	// if spl_params.debug = null, we don't know if we're logging debug messages yet 
	// (this is determined in the initial SPL message), so save to a temp var and write later
	// if debug = false, don't log at all
	if(spl_params.debugEnabled == false){return}
	if(spl_params.debugEnabled == 'unknown'){
		tempLogString += "(PID:" + process.pid + ") "+ msg + "\n"
		return
	}
	if((spl_params.debugEnabled == 'full') || (spl_params.debugEnabled == 'info')){
		if (tempLogString && logfile != ''){
			fs.appendFileSync(logfile, tempLogString, function (err) { })
			tempLogString = null

		}
		if(logfile != '' ){
			fs.appendFileSync(logfile, "(PID:" + process.pid + ") "+ msg+ "\n", function (err) { })
		}
		
	}
	
}

/***************************************************
* send an error message back to Splunk and halt gracefully
*	
* @param {string}	msg	the message to log
*/
const halt_on_error = function (msg){

	log("halt_on_error: " + msg )
	// Remove all newlines, backslashes, and double-quotes from 'msg'
	msg = msg.replace(/(\r\n|\n|\r|\u0d0a)/gm," ")
	msg = msg.replace(/\\/g, "\\\\");
	msg = msg.replace(/\"/gm," ")

	try {
		metadata = JSON.stringify({"finished":true,"error": msg})
	} catch (err) {
		// if for some reason the stringify function throws an error, let's just  
		// build the errror string manually so we're sure to send useful info back
		metadata = '{"finished":true,"error":"'  + msg +'"}'
	}
	
	try {
		bytes = Buffer.byteLength(metadata, 'utf8')
	} catch (err) {
		// fallback, in case of error we can just hope there are no multi-byte unicode chars
		bytes=metadata.length
	}


	const transportHeader = 'chunked 1.0,' + bytes + ",0\n"
	process.stdout.write(transportHeader + metadata)

	// sleep until splunk kills us
	const seconds = 10
	var waitTill = new Date(new Date().getTime() + seconds * 1000);
	while(waitTill > new Date()){}

}

/*************************************************
* 	load (slow to load) modules
*	make async so we don't have problems
*
* 
*/
const load_modules = function(){
	log("loading Modules....")
		
	try {		
		// Load explicity, not by package name (otherwise you get intermittent load errors)
		// super weird, but this seems to work (further testing required)
		log("\tcyberchef as chef")
		chef = require("cyberchef")
	} catch (err) {
		halt_on_error("Error loading required module Cyberchef: " + err)
	}

	try {
		log("\tcsv-parse as parse_csv")
		parse_csv = require('csv-parse/lib/sync')
		log("\tcsv-stringify as stringify")
		stringify = require('csv-stringify/lib/sync')
		log("\tstream-transform as transform")
		transform = require('stream-transform/lib/sync')
	} catch (err) {
		halt_on_error("Error loading required module (one of the csv modules): " + err)
	}
	log("All modules loaded without error.")

}

/*************************************************
* 
*	
*
* @param {string}	msg	the message to log
*/
const loadRecipesFromFile = function( recipeAliasToLoad ) {

	log("entering function loadRecipesFromFile, looking for: " + recipeAliasToLoad)

	const recipeFolders = ['../local/recipes', '../default/recipes' ]

	var filenames = []
	for(var i=0; i < recipeFolders.length; i++) {
		try {
			var f = fs.readdirSync(recipeFolders[i] )
			for (var j = 0; j < f.length; j++ ){
				f[j] = __dirname + '/' + recipeFolders[i] + '/' +  f[j]
			}
			filenames = filenames.concat(f)
		} catch (err) {}
	}

	log("checking filenames: \n\t" + filenames.join("\n\t") + "\n")


	for(var j = 0; j < filenames.length; j++)
	{
		
		var file = filenames[j]
		log ("Checking " + j + " of " + filenames.length + ": " + file )
		if (file.endsWith("README.txt")){ continue }

		log("\t Checking content of file: " + file)
		try {
			var content = fs.readFileSync( file, 'UTF-8')
		} catch(err) {
			// do nothing
		}

		if(content.length == 0) {continue}
		
		// split the content of the file by lines
		line = content.split(/\r?\n/);

		// iterate over each line, looking for valid key:value pairs, and then match key
		for(var i = 0; i< line.length; i++){
			//if(! line.includes(":")) {continue}

			// does the line start with a \w char (otherwise its a comment)
			if( (line[i].charAt(0).search(/\W/i)) )   {
				
				// split the line at the first colon found, left side is the nickname, right side is the json recipe
				var recipeName = line[i].substr(0,line[i].indexOf(':')).trim()
				var recipeCode = line[i].substr(line[i].indexOf(':')+1).trim()
				log("Checking " + recipeName + " against " + recipeAliasToLoad)
				if (recipeName == recipeAliasToLoad) {
					return recipeCode
				}
				
			}
		}
		
		
		
	}

	halt_on_error("Can't find recipe in ./local/recipes/* that matches: " + recipeAliasToLoad)
}
//-----------------------------------------------------
//
//		            BEGIN HERE
//
//-----------------------------------------------------

process.stdin.setEncoding('utf8')
process.stdin.on('readable', () => {
    log('---------------------------------------------------')
    log('Entering process.stdin.on')

    var chunk = process.stdin.read();

    if (chunk == null) { log("Empty message recived on stdin, returning"); return } // sometimes at the end, splunk sends an empty message

    log ('Read ' + chunk.length + ' characters of data from stdin.')
    if((spl_params.debugEnabled != false) || (spl_params.debugEnabled != 'info')) { log('Received Chunk from STDIN: \n<<SOF>>' + chunk + "<<EOF>>")}

	// Do we have only a partial message, and we're reading more of it?
	if(message != null){
		log("Appending chunk to partial message. Message size (chars) is: " + message.length + ", Chunk size (chars) is: " + chunk.length + ", Total needed message size (bytes) is: "+ (metadataSize + payloadSize) )
		message += chunk;

		try {
			bytes = Buffer.byteLength(message, 'utf8')
		} catch (err) {log(err.message + ", " + err.name)}

		log("message size (bytes) when combining the original partial message and the newly received chunk is " + bytes)

		if(bytes != (metadataSize + payloadSize)){
			// we don't have a full message yet, read more from stdin
			// TODO: check for overlength message
			log("Complete message not yet received." )
			return;
		} else{
			log("Recieved remainder of partial message.")
		}

	} else {
		// parse the new message
		log("New Message Recieved:")
		// parse first line of chunk for size of json and payload
		const rawHeader = chunk.split(/\n/,1)[0]	
		const headerRegex = /^chunked 1.0,(\d+),(\d+)/;
		const sizes = rawHeader.match(headerRegex);
		
		metadataSize = parseInt(sizes[1])
		payloadSize = parseInt(sizes[2])

		log('\t - MetadataSize (from header):     ' + metadataSize)
		log('\t - PayloadSize (from header):      ' + payloadSize)

		// remove the header from the data and continue
		message = chunk.slice(rawHeader.length + 1)

		try {
			bytes = Buffer.byteLength(message, 'utf8')
		} catch (err) {log(err.message + ", " + err.name)}

		log('\t - Actual received message size is chars: ' + message.length + ', bytes: ' + bytes )

		// do we have a complete message at this point?
		if (bytes !=  (metadataSize + payloadSize)){
			log("Incomplete new message recieved, waiting for rest.")
			return;
		}

	}


	// We have a complete message at this point
	log("Complete message recieved. Processing Json metadata")

	// parse the metatdata into a json object
	const rawMetadata = message.slice(0, metadataSize )
	var parsedMetadata = null
	try{ parsedMetadata = JSON.parse(rawMetadata)
	} catch (err){ halt_on_error("Error Parsing json metadata: " + err.message) }

	log("json metadata parsed: \n" + JSON.stringify(parsedMetadata, null, 4))


	// is this a getinfo or execute message?
	if(parsedMetadata.action == 'getinfo'){
		// save the options to a global variable if this is a getinfo
		searchOptions = parsedMetadata

		log("getinfo message recieved")

		// if we have a valid SID (nnnnnnnnnn.n+) and logfile is empty (not explicity set for testing), start logging there
		if (logfile == '' && searchOptions.searchinfo.sid.match(/^\d{10}\.\d+$/)){
			logfile = searchOptions.searchinfo.dispatch_dir + "/debug.log"

			// log a few extra things if we're starting up logging now
			log("dispatch_dir identifed, starting logging to: " + logfile)
			if((spl_params.debugEnabled != false) && (spl_params.debugEnabled != 'info')) { log('Received Chunk from STDIN: \n<<SOF>>' + chunk + "<<EOF>>")}
			log("json metadata parsed: \n" + JSON.stringify(parsedMetadata, null, 4))	
		}
		
		// get a string representation of our json reply
		jsonReply = getinfo_reply()

		// send our getinfo reply
		const transportHeaderReply = 'chunked 1.0,' + jsonReply.length + ',0'
		log("Sending GETINFO SplunkMessage.")
		if((spl_params.debugEnabled != false) && (spl_params.debugEnabled != 'info')) { log("<<SOF>>" + transportHeaderReply +"\n" + jsonReply + "<<EOF>>") }
		process.stdout.write(transportHeaderReply + "\n" + jsonReply)

		// reset our message variables for the next inbound message (keep the search parameters though)
		message = null
		metadataSize = null
		payloadSize = null

		// load the modules we'll require when processing an ACTION message
		// cyberchef is sloooooo to load, so doing this when splunk is working on building the info 
		// to send us may save a bit of time.
		load_modules()
		return;
	
	} else if (parsedMetadata.action == 'execute'){
		log('execute message recieved')
		//extract the payload from the chunk (starting right after the metadata, no newline)
		payload = message.slice(metadataSize)

		modifiedPayload = modify_payload(payload)

		log("the type of modifiedPayload is " + typeof(modifiedPayload))
		var bytes
		try {
			bytes = Buffer.byteLength(modifiedPayload, 'utf8')
		} catch (err) {log(err.message + ", " + err.name)}


		log("Size of Payload to Return is\n\tchars:" + modifiedPayload.length + "\n\tbytes: " + bytes)
		// Return our payload
		jsonReply = '{"finished":' + parsedMetadata.finished + '}'
		const transportHeaderReply = 'chunked 1.0,' + jsonReply.length + ',' + bytes

		log("Sending execute SplunkMessage")
		if((spl_params.debugEnabled != false) && (spl_params.debugEnabled != 'info')) { log( "<<SOF>>" + transportHeaderReply +"\n" + jsonReply + modifiedPayload + "<<EOF>>" ) }

		process.stdout.write(transportHeaderReply + "\n" + jsonReply + modifiedPayload)

		// reset our message for the next message
		message = null
		metadataSize = null
		payloadSize = null

		return

	} else {
		// unknown action
		halt_on_error("unknown action found in jsom metadata: " + parsedMetadata.action)
	}

	// We should never make it here
	halt_on_error("Unexpected error: unreachable code reached.")



}) // end process.stdin.on (readable)
