

/*-------------------------------------------------------------------------------------------
// TODO:

-	troubleshoot windows newlines in data
-	troubleshoot csv file input
-	test on linux
-	update commands.conf for new option (jsonRecipe) and examples
-	get logo




// TODO v2
-	new script to list all recipes 

// DONE
- 	fix grammer to incude debug=full/info
-	modify script to handle debug option correclty
- 	ensure log file is written before error out
-	log output data if debug=full
-	log to dispatch dir only if matches nnnnnnnnn.nnn
- 	fix grammer to handle quotes properly (escaped)
-	add pipe as escaped char for quotedfield name

-------------------------------------------------------------------------------------------*/

//	EXAMPLE SEARCHES
// index=wineventlog sourcetype="WinEventLog:Security" 
// | head 10 
// | cyberchef infield=RecordNumber outfield=xxx jsonRecipe="[{"op":"To Base64","args":["A-Za-z0-9+/="]}]" 
// | table RecordNumber xxx

// source="download.csv" host="FIREFLY-WIN" index="vox_covid" sourcetype="ecdc.europa.eu-csv" 
// | cyberchef infield=cases outfield=xxx jsonRecipe="[{"op":"To Base64","args":["A-Za-z0-9+/="]}]" 
// | table cases xxx

// ERROR (due to newlines)
// index=wineventlog sourcetype="WinEventLog:Security" 
// | head 1
// | cyberchef infield=Message outfield=xxx jsonRecipe="[{"op":"To Base64","args":["A-Za-z0-9+/="]}]" 
// | table Message xxx

//-------------------------------------------------------------------------------------------
// Current Bugs:
//	1. if your source data has newlines, then this won't work.
//	2. FieldNames: don't have to escape fieldnames like the rest of splunk, ascii only


//-------------------------------------
// 			DEBUG
//-------------------------------------

const fs = require('fs'); 
const logit = function (msg) { 	
	//fs.appendFileSync('jsStdout.txt', process.pid +":  " + msg + "\n", function (err) { if (err) throw err; }); 

	if (debugEnabled == 'none') {return}
	if (dispatch_dir == null ) {return}

	// if debugEnbaled hasn't been set yet, just archive the log data to the 'debugRecords' variable to write later (if wanted)
	if (debugEnabled == '') {
		debugRecords += "PID:" + process.pid + "\t" + msg + "\n"

		//fs.appendFileSync('jsStdout.txt', "Archiving DATA:"+msg+"\n", function (err) { })

	} else {
		var logFileName = dispatch_dir + '\\cyberchef.log'
		var logFileName = 'cyberchef.log'	// TODO remove this line (with above)
		// check if we have anything in our debugRecords var to log first
		if (debugRecords.length > 0) {
			fs.appendFileSync(logFileName,  debugRecords, function (err) { if (err) errorOut("Error writing debug log file " + logFileName + '; ' + err.message) })
			debugRecords = ''
		}
		// and log the data
		fs.appendFileSync(logFileName,  "PID:" + process.pid + "\t" + msg + "\n", function (err) { if (err) errorOut("Error writing debug log file " + logFileName + '; ' + err.message) }) 
	}


}
// END DEBUG

//-----------------------------------------------------------------------------
//						Globals
//-----------------------------------------------------------------------------
//var recipes = {}	// all the recipes loaded from file ../recipes

const maxPayloadSize = 0		// do not exceed in reply or Splunk will error. Must be =< maxchunksize in commands.conf
								// NOTE: NOT WORKING. Keep at 0.

var dispatch_dir = 'unknown'		// the directory splunk uses for logging for this search
							// passed in getinfo, can be blank, end in tmp (ex .../283e00c9b0176a64_tmp), or a the full directory
							// useful for logging

var debugEnabled = ''	// if we receive a debug option (full or info) then log it 
var debugRecords = ''	// store debug info until we know if we write it or not

//-----------------------------------------------------------------------------
//						CLASS DEFINITIONS
//-----------------------------------------------------------------------------
/** @class splunkMessage representing a message received from Splunk
*
*	Message format is odd. it's a header followed by a newline, then a sinle
*	line of json as a string, and followed by optional data
*
*	data is a csv formatted to a string, with a header and newlines sepearting the rows
*	Since data comes from splunk via STDIN as chuncks, we may only get portions of the 
*	data at a time, so we have to take each chunk of data, add it to the splunkMessage
*   instance, in the correct places.
*
**/
class splunkMessage {
	/**
	* Creates an instance of splunkMessage.
	*
	* @constructor
	* @param {string}	rawHeader 		The header received in the message
	* @param {boolean}	completeHeader 	Does rawHeader contain a comlete header
	* @param {string}	rawMetadata		The metadata as a single string
	* @param {string}	metadataCommand	The message command:  GETINFO or ACTION
	* @param {int}		metadataSize	Number of Chars of metadata, determined from the header
	* @param {int}		payloadSize		Number of Chars of payload, determined from the header
	* @param {string}	inputSearchField	Field to read data from for processing by cyberchef
	* @param {string} 	outputSearchField	Field to write data motdified by cyberchef
	* @param {string} 	operation the cyberchef operation to run (single operation, no options)
	* @param {string} 	recipe the alias of the json-formatted recipe to load from file
	* @param {string} 	recipeJson Json-formatted recipe for chef to run
	* @param {string} 	b64recipe b64-encoded Json-formatted recipe for chef to run
	* @param {string} 	rawPayload The entire payload (including column headers) as a single string.
	*/
	constructor () {
		this.rawHeader = ''
		this.completeHeader = false
		this.rawMetadata = ""
		this.metadataCommand = ''
		this.metadataSize = 0
		this.payloadSize = 0

		this.inputSearchField = ''
		this.outputSearchField = ''
		this.operation = ''
		this.recipeJson = ''
		this.recipe =''
		this.b64recipe =''
		this.jsonRecipe = ''

		this.rawPayload = ''
	}

	/*
	* Parse the metadata field (json as string) from a splunkMessage.
	*	Determines the type of command (getinfo or action), as well as  
	*	the search parameters (which fields to read/write from payload).
	*	These values are saved within the splunkMessage object.
	*
	* @returns: nothing
	* @this: splunkMessage instance
	*/
	parseMetadata (){
		logit ("Parsing metadata from splunkMessage header json.")
		// Throw fatal error if actual metadata doesn't match the size in the header
		if(this.rawMetadata.length !=  this.metadataSize) { 
			errorOut("Fatal error in function parseMetadata: Attepmpt to parse incomplete message from Splunk.")
		}
		
		// parse metadata string JSON for 'action' field to determine if this is a GETINFO or EXECUTE message
		try {
			this.metadataCommand = (JSON.parse(this.rawMetadata)).action
		} catch (err) {
			errorOut("Fatal error in function parseMetadata: Error parsing metadata JSON for action field:" + err.message)
		}

		logit ("\t(from metadata json header) command is: " + this.metadataCommand)
		
	    if (this.metadataCommand == 'getinfo') {
	    	// get our dispatch_dir from the getinfo (save to global var)
	    	try {
				dispatch_dir = (JSON.parse(this.rawMetadata)).searchinfo.dispatch_dir
			} catch (err) {
				errorOut("Fatal error in function parseMetadata: Error parsing metadata JSON for dispatch_dir field:" + err.message)
			}
			logit ("\t(from metadata json header) dispatch_dir is: "  + dispatch_dir)


			// (TOOD:FIX)if dispatch_dir doesn't match nnnnnnnnn.nnn, then ignore logging
			if (dispatch_dir.match(/\d{10}\.\d{3}$/) != null){
				//dispatch_dir = 'C:\\Program Files\\Splunk\\etc\\apps\\cyberchef\\bin'
			} else {
				dispatch_dir = null
			}
			

	    	// get searchOptions and field names from metadta JSON
			try {
				var searchOptions = (JSON.parse(this.rawMetadata)).searchinfo.raw_args
			} catch (err) {
				errorOut("Fatal error in function parseMetadata: Error parsing metadata JSON for search options field:" + err.message)
			}

			// search string needs to be a string, not a half-assed array of kv pairs
			searchOptions = searchOptions.join(' ')

			logit ("\t(from metadata json header) search string is: "  + searchOptions)

			// load required parser
			try{
				var nearley = require("nearley");
			} catch (err) {
				errorOut("Error loading required library 'nearley':  " + err.message)
			}

			// load the grammer that defines how to parse the input string
			try{
				var grammar = require("./grammar.js");
			} catch (err) {
				errorOut("Error loading required nearley grammar: " + err.message)
			}

			// parse the input string against our grammar
			const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

			try {
				parser.feed(searchOptions);
			} catch (err){
				logit ("Fatal Error trying to parse input options with nearly parser. The parser output is: \n" + err.message.split("\n",5 ).join("\n") + "\n" )
				errorOut("Error trying to parse input options. Please see cyberchef.log in this search's dispatch_dir for details. Error: " +  err.message.split("\n",1) )
			}
			
			var kvPairs = parser.results[0]

			// check which fields we received
			// we don't have to validate input, as the parser nicely does that for us.
			logit ("Evaluating KV Pairs from parser:")
			debugEnabled = 'none'

			for(var i = 0; i < kvPairs.length; i++){

				for (const [key, value] of Object.entries(kvPairs[i])) {
					logit ("\tKey: " + key + " ; Value: " + value)
					switch(key){
						case 'infield':
							this.inputSearchField = value; break
						case 'outfield':
							this.outputSearchField = value; break
						case 'recipe':
							this.recipe  = value.toLowerCase(); break
						case 'operation':
							this.operation = value; break
						case 'b64recipe':
							this.b64recipe = value; break
						case 'jsonRecipe':
							this.jsonRecipe = value; break	
						case 'debug':
							debugEnabled = value; 
							// todo: check that we have a valid dispatch_dir here (form 1604422794.566)
							// todo: dump past debug info
							break
						default:
							// todo: unknown option here
							break			
					}

				}
			}

			// if no outfield, then set it to the infield
			if (this.outputSearchField.length == 0){ this.outputSearchField = this.inputSearchField}

			return

	    } else if (this.metadataCommand == 'execute') {
			// we don't acutally execute anything yet, we need to collect all the payload first.
		} else {
			errorOut("Fatal Error: unknown command received via SplunkMessage in metadata json: ", this.metadataCommand)
		}
	}

	/**
	* Take a string of data and use it to build our splunkMessage.
	*	data can come in chunks, so we assemble the message bit-by-bit
	*
	* @param {string}	data	the string containing data to add
	*/
	addData(data){
		logit ("in function addData")
		logit ("\tActual data size to process is: " + data.length)
		// this function assumes that all data recieved is at least a full line (no messages split mid-line)
		// does the current message have a complete header?
		if(! this.completeHeader){
			logit ("\tAdding data to incomplete or empty header.")
			this.rawHeader = data.split(/\r\n|\n|\r/,1)[0]
			this.completeHeader = true

			// from the header, determine the expected metadata and payload sizes
			var sizes = this.rawHeader.split(',')
			this.metadataSize  = sizes[1]
			this.payloadSize = sizes[2]

			// remove the header from the data and continue
			data = data.slice(this.rawHeader.length + 1)

			logit("\tValues recieved in header are:\n\t\t\t\t- metadataSize: " + this.metadataSize + "\n\t\t\t\t- payloadSize: " + this.payloadSize )
		} 

		if(data.length == 0) {logit("\tData only contained the header (no metadata or payload), returning."); return ''}

		logit ("\tRemaining data size after parsing header is: " + data.length)

		// does the current message have metadata?
		if(this.rawMetadata.length == 0){
			logit ("\tAdding data to incomplete or empty metadata.")
			// the data should be longer than the expected length
			if (data.length < this.metadataSize) {
				errorOut("Received truncated metadata from Splunk server. Not able to continue.")
			}
			this.rawMetadata = data.slice(0, this.metadataSize )
			this.parseMetadata()

			data = data.slice(this.metadataSize)
		} 

		logit ("Back in function addData")

		if(data.length == 0) { logit("\tData only contained the header and metadata (no payload), returning.");return ''}
		logit ("\tRemaining data size after parsing metadata is: " + data.length)
		logit ("\tExpected payload size from header is: " + this.payloadSize)

		// process payload (we could be appending to an existing message)
		// TOO: bug: if the data has newlines in the fields, then the count if off. (might be windows specific)
		if (data.length <= this.payloadSize) {
			logit("\tadding data to payload")
			this.rawPayload += data
			return ''
		} else {
			// this usually only hapens if you're having bottlenecks that slow things down.
			logit ("\tThe data recieved is larger than expected, it's probably another message backed up in the STDIN queue. Returning extra data back for re-processing.")
			this.rawPayload += data.slice(0, this.payloadSize)
			return data.slice (this.payloadSize)
		}
	}

	/**
	* re-initalize a splunkMessage back to defaults.
	*/
	zeroize() {
		logit ('In Function zeroize')
		this.rawHeader = ''
		this.completeHeader = false
		this.rawMetadata = ""
		this.metadataCommand = ''
		this.metadataSize = 0
		this.payloadSize = 0

		this.inputSearchField = ''
		this.outputSearchField = ''
		this.operation = ''
		this.recipe = ''
		this.recipeJson = ''
		this.b64recipe =''
		this.rawPayload = ''
		this.jsonRecipe = ''
	}

	/**
	* Check a splunkMessage to see if it is a complete message.
	* 	for a GETINFO message, do we have full metadata
	*	for a EXECUTE message, do we have a full payload
	*
	@ return {boolean} If the splunkMessage is a complete message
	*/
	checkMessageComplete() {
		logit("In function: checkMessageComplete")
		if(this.metadataCommand == 'getinfo') {
			if(this.completeHeader && (this.rawMetadata.length ==  this.metadataSize)) {logit("\tGETINFO Message Is Complete."); return true}
			else {logit("\tGETINFO Message Is NOT Complete.");return false}
		} else if (this.metadataCommand == 'execute') {

			// bug: with newlines in results, actual payload may be a little smaller than the advertised datasize
			if (this.rawPayload.length >= this.payloadSize){logit("\tEXECUTE Message Is Complete.");return true} else {logit("\tEXECUTE Message Is NOT Complete.");return false}
		}
	}

	/**
	* Partialy Clone a splunkMessage instance to a new splunkMessage instance.
	*	NOTE: only clones a few specific fields neede by the EXECUTE command
	*	todo: move to global variable instead
	*
	* @this: splunkMessage instance to clone
	* @return {splunkInstance} a new splunkMessage object
	*/
	cloneForExecute(){
		logit("In function: cloneForExecute.")
		// only a few fields are needed for processing. copy those fields and return new object
		var x = new splunkMessage()
		x.inputSearchField =  this.inputSearchField 
		x.outputSearchField = this.outputSearchField
		x.operation = this.operation 
		x.recipe = this.recipe 
		x.recipeJson = this.recipeJson
		x.rawPayload = this.rawPayload
		x.b64recipe = this.b64recipe
		x.jsonRecipe = this.jsonRecipe
		return x
	}

	/**
	* DEBUG Command: for logging during testing. sends object info to logger
	*
	*/
	print(){
		logit("---------Start------------")
		logit("		From header, metadata size is "+ this.metadataSize+ "; payload size is: "+ this.payloadSize)
		logit("		message type is: " + this.metadataCommand)
		//logit("		- InField is: " + this.inputSearchField)
		//logit("		- Outfield is: " + this.outputSearchField)
		//logit("		- operation is: " + this.operation)
		logit("		- recipe is: " + this.recipe)
		logit("		- recipeJson is: " + this.recipeJson)
		//logit("		rawPayload is : \n" + this.rawPayload +"\n<<END>>")
		logit("		calculated rawPayload Size is: " + this.rawPayload.length)
		logit("		number of lines is: " + (this.rawPayload.match(/\n/g) || '').length + 1)
		logit("----------Done------------")
	}
}


//-----------------------------------------------------------------------------
//						HELPER FUNCTIONS
//-----------------------------------------------------------------------------


/**
* Send an ERROR GETINFO message to STDOUT for Splunk to process. 
*	Splunk will  log the message and terminate the node process execution
*
* @param {string}	msg	the message to send back
*/
const errorOut = function(msg){
	// todo: remove newlines and banned chars from msg (so they don't throw an error)

	// if logging is not known, write it out anyways
	if (debugEnabled =='') {debugEnabled = "info"}
	logit ("FATAL ERROR.  Execution failed, sending error back to Splunk. Error: " + msg)


	const metadata = '{"finished":true,"error":"'  + msg +'"}'
	const transportHeader = 'chunked 1.0,' + metadata.length + ",0\n"
	process.stdout.write(transportHeader)
	process.stdout.write(metadata)
	process.exit()
}

// const messageUser = function(msg){
// 	// TODO: NOT WORKING.
// 	// send a GETINFO message back to the splunk server 
// 	// msg is the message to send back and display in splunk web.

// 	//const metadata = '{"action":"getinfo","finished":true,"inspector":{"messages":[["WARN","avdsn asnosdn               "]]}}'
// 	const metadata = '{"finished":false,"inspector":{"messages":[["INFO","test TEST test asdf"]]}}'
// 	const transportHeader = 'chunked 1.0,' + metadata.length + ",0\n"

// 	process.stdout.write(transportHeader)
// 	process.stdout.write(metadata)
// }

/**
* Send GETINFO message to STDOUT for Splunk to process. 
*	this GETINFO will have implementation-specific commands 
* 	(what fields we want , type of command, etc)
*	First line is a header, second line is the json reply (with no newline)
*
* @param {splunkMessage} msg the splunkMessage object to return
* @todo Make dynamic
*/
const sendGetInfo = function (msg) {
	logit ("Entering function sendGetInfo")
	// which field(s) do we require from splunk, as array of strings
	searchFields = [msg.inputSearchField]

	
	if (msg.outputSearchField != msg.inputSearchField ) {searchFields.push( msg.outputSearchField)} 
	logit("\tSearchFields are: " + searchFields)
	
	try {
		jsonReply = JSON.stringify({
			type: "streaming",
			required_fields:  searchFields
		})	
	} catch(err) {
		errorOut("Fatal Error in function sendGetInfo:  JSON Stringify error crafting GETINFO reply:" + err.message)
	}

	var transportHeaderReply = 'chunked 1.0,' + jsonReply.length + ',0'

	logit("\tSending GETINFO SplunkMessage:\t" + transportHeaderReply +" " + jsonReply)

	process.stdout.write(transportHeaderReply +"\n")
	process.stdout.write(jsonReply)
}

/**
* Send DATA to STDOUT for Splunk to process. 
*	First line is a header, second line is the json reply (with no newline), 
* 	followed by payload (without a newline sepearating the header and payload) 
*
* @param {splunkMessage} data the splunkMessage to and return
* @todo Make dynamic
*/
const returnProcessedData = function(data){

	logit("In fuction returnProcessedData")
	// metadata 'Finished' option should match that of Splunk's last message
	// if =true, then splunk will shutdown further processing

	try {
		var finished = JSON.parse(data.rawMetadata).finished
	} catch (err) {
		errorOut("Fatal Error in function returnProcessedData:  JSON Stringify error crafting reply: " + err.message)
	}	
	if(finished ) {var metadata = '{"finished":true}'}
	else {var metadata = '{"finished":false}'}

	logit("\tmessage finished state is " + metadata )

	// determine if payload is larger than maxPayloadSize, and split the reply into multiple packets if so.
	// TODO: NOT WORKING, we reuturn all data at once, not in chunks.
	if(maxPayloadSize == 0 || data.rawPayload.length < maxPayloadSize){
		// just send it as is
		const transportHeader = 'chunked 1.0,' + metadata.length + ',' + (data.rawPayload.length) + "\n"
		logit("\tSending Complete ACTION: " + transportHeader.trim() + ' ' + metadata +' ; payload size is: ' + data.rawPayload.length)
		if(debugEnabled == 'full') {logit( "\tRaw Payload sent is: \n" + data.rawPayload + "<<EOF>>")}

		process.stdout.write(transportHeader)
		process.stdout.write(metadata)
		process.stdout.write(data.rawPayload)


	} else {
		// TODO: NOT WORKING (Do not Use)
		// break it up. get the header from the first line
		logit("Sending Partial ACTION packets.")
		var csvHeader = data.rawPayload.split('\n')[0] + "\n"
		var partialPayload = csvHeader 

		//logit ("CSV Header is: " + csvHeader + "<<EOF>>")

		payloadArray = data.rawPayload.split('\n')

		//logit("  Total payloadArray.length is: " + payloadArray.length)

		// ignore the first line (header) and the last line (crlf) in the payload
		for(var i = 1; i < payloadArray.length - 1; i++){
			// +2 for the CRLF requied
			// + 22 for the header & metadata size (probably alwasy less than this)
			//logit ("WOrking on row i: " + i + ", " + payloadArray[i] )

			if(partialPayload.length + payloadArray[i].length + 2 + 22 >= maxPayloadSize ) {

				// finished = true ONLY if that was what we recieved AND we have no more data (edge case)
				if(finished && i == payloadArray[i].length - 1 ) {var metadata = '{"finished":true}'}
				else {var metadata = '{"finished":false}'}

				const transportHeader = 'chunked 1.0,' + metadata.length + ',' + (partialPayload.length)  + "\n"
				process.stdout.write(transportHeader)
				process.stdout.write(metadata)
				process.stdout.write(partialPayload)

				//logit("Sending INTERMEDIATE Parital ACTION: " + transportHeader.trim() + ' ' + metadata +' size:' + partialPayload.length)
				//logit(partialPayload + "<<EOF>>")

				partialPayload = csvHeader +  payloadArray[i] + "\r\n"
			} else {
				partialPayload +=  payloadArray[i] + "\r\n"
			}
		}

		//send the rest
		// todo make sure not empty
		const transportHeader = 'chunked 1.0,' + metadata.length + ',' + (partialPayload.length) +"\n"
		process.stdout.write(transportHeader)
		process.stdout.write(metadata)
		process.stdout.write(partialPayload)
		//logit("Sending FINAL Partial ACTION: " + transportHeader.trim() + ' ' + metadata +' size:' + partialPayload.length)

		//logit(partialPayload  + "<<EOF>>")
		// logit("...Sleeping 2")
		// var now = new Date().getTime();
		//    while(new Date().getTime() < now + 5000){ /* do nothing */ } 
		//    logit("...Awake!")
	}

	logit("leaving function returnProcessedData")
}

/**
* Process the payload of a splunkMessage with cyberchef
*
* @param {splunkMessage} msg the splunkMessage to process
* @return {string} the results as a csv-formatted string
* @todo Make dynamic
*/
const processPayload = function(msg){
	// where the magic hapens. Modify the payload here before returning it.
	// load cyberchef and csv-string modules. delayed so we don't load it for each GETINFO command which doesn't use it

	logit('In function processPayload')

	try {
		var chef = require("cyberchef")
	} catch (err) {
		errorOut("Fatal Error in function processPayload:  Can't load module Cyberchef " + err.message + ", " + err.name)
	}

	try {
		//var CSV = require('csv-string')
		var parse = require('csv-parse/lib/sync')
		var stringify = require('csv-stringify/lib/sync')
		var transform = require('stream-transform/lib/sync')
	} catch (err) {
		errorOut("Fatal Error in function processPayload:  Can't load module csv: " + err.message)
	}

	// take the raw payload (headers and data) from the message, convert to object
	try {
		var events = parse(msg.rawPayload , {
			columns: true	//Infer the columns names from the first line.
		})
	} catch (err) {
		errorOut("Fatal Error in function processPayload:  csv-parse error on payload: " + err.message)
	}

	logit('\tNumber of events to process: ' + events.length)

	// Determine if we're running a simple operation, a complex recipe loaded from file, or a b64-encoded recipe
	var cmdToRun = ''
	if(msg.operation.length > 0){
		cmdToRun = msg.operation
	} else if (msg.recipe.length > 0) {
		try {
			cmdToRun = JSON.parse( msg.recipeJson)
		} catch (err){
			errorOut("Fatal Error in function processPayload: error during desearalize json of recipe named "+ msg.recipe + ". Error:" + err.name)
		}
	} else if (msg.b64recipe.length > 0) {
		try{
			cmdToRun = chef.bake(msg.b64recipe, 'FromBase64' )
		}catch (err){
			errorOut('Can not process b64-encoded string. Error: ' + err.message)
		}
		try {
			cmdToRun = JSON.parse( cmdToRun)
		} catch (err){
			errorOut("Fatal Error in function processPayload: error during desearalize json from b64.  Error: " + err.name)
		}
	} else {
		try {
			cmdToRun = JSON.parse( msg.jsonRecipe)
		} catch (err){
			errorOut("Fatal Error in function processPayload: error during desearalize json of jsonRecipe. Error:" + err.name)
		}
	}

	// todo: fix this so it doesn't print [object Object]
	logit("\tcyberchef command to run is: " + cmdToRun[0].toString())

	// Iterate over each row of data and process with cyberchef
	const newrecords = transform(events, function(record){
		try {
			record[msg.outputSearchField] = (chef.bake( record[msg.inputSearchField] , cmdToRun)).toString()
		} catch (err) {
			errorOut("CyberChef " + err.message)
		}
	  	return record
	})

	logit("\tprocessed " + newrecords.length + " records to return")
	// convert objects back to csv string and save back to our message
	try {
		//return CSV.stringify(events)
		return stringify(newrecords, {header: true, quoted_match:/\s|\R|,|=/ })
	} catch (err) {
		errorOut("Fatal Error in function processPayload: Error converting results to CSV file. CSV.stringify error on return: " + err.message)
	}
}


const loadRecipesFromFile = function( recipeAliasToLoad ) {

	const recipeFolders = ['..//local//recipes//', '..//default//recipes//' ]

	try {
		var fs = require('fs')
	}catch(err){
		errorOut("Fatal Error in function loadRecipesFromFile:  can't load fs module: " + err.message)
	}

	var filenames = []
	for(var i=0; i < recipeFolders.length; i++) {
		try {
			var f = fs.readdirSync(recipeFolders[i] )
			for (var j = 0; j < f.length; j++ ){
				f[j] = __dirname + '\\' + recipeFolders[i] + '\\' +  f[j]
			}
			filenames = filenames.concat(f)
		} catch (err) {}
	}

	for(var i = 0; i < filenames.length; i++)
	{
		var file = filenames[i]
		if(! file.endsWith("README")  ){ 
			try {
				var content = fs.readFileSync( file, 'UTF-8')
			} catch(err) {
				// do nothing
			}
			
			if(content.length != 0){
				line = content.split(/\r?\n/);

				for(var i = 0; i< line.length; i++){
					// does the line start with a \w char (otherwise its a comment)
					if(line[i].charAt(0).search(/\W/i)) {
						// split the line at the first colon found, left side is the nickname, right side is the json recipe
						var recipeName = line[i].substr(0,line[i].indexOf(':')).trim()
						var recipeCode = line[i].substr(line[i].indexOf(':')+1).trim()
						if (recipeName == recipeAliasToLoad) {
							return recipeCode
						}
						
					}
				}
			}
		}
		
	}

	errorOut("Can't find recipe in ./local/recipes/* that matches: " + recipeAliasToLoad)
}



//-----------------------------------------------------------------------------
//						BEGIN PROGRAM EXECUTION HERE
//-----------------------------------------------------------------------------

var workingMessage = new splunkMessage()	// the partial splunkMessage we have recieved

var getInfoMessage 		// a complete GETINFO message with search information

process.stdin.setEncoding('utf8')
process.stdin.on('readable', () => {
	//logit('-----------------------------------------------------------------------------')
	//process.stderr.write("THIS SHOWS AS ERROR IN search.log (non-fatal though)")
	//messageUser("a")

	logit("Entering function process.stdin.on")
	// receive whatever data is in stdin
	chunk = ''
	var chunk = process.stdin.read();
	if (debugEnabled == '' || debugEnabled == 'full' ) {logit("\tReceived raw chunk of data via stdin:\n" + chunk + "<<EOF>>")}

	if (chunk == null) { return }
	
	// process chunk of data (may be partial or multiple messages)	
	while(chunk != ''){

		// convert the stdin chunk into a splunkMessage. could be too short or multiple messages in one
		chunk = workingMessage.addData(chunk)
		if(chunk.length > 0) {logit("\tRecieved multiple messages at once via stdin (not an issue, just rare).  Maybe there are some performance issues to look at on your system?")}

		if (workingMessage.checkMessageComplete()){
			// if packet is getinfo, send capabilities reply
			logit("\tRecieved complete SplunkMessage of type: " + workingMessage.metadataCommand )

			if(workingMessage.metadataCommand == 'getinfo'){
				sendGetInfo(workingMessage)
				getinfoMessage = workingMessage.cloneForExecute()	// save info from the command
				workingMessage.zeroize()
				return
			} else if(workingMessage.metadataCommand == 'execute') {

				// Edge Case: Sometimes Splunk sends an empty packt when chunked processing is done
				// watch for action = execute and FINISHED=TRUE
				// check if the payload has no data (only the CSV header and finished = true)
				const payloadLines = workingMessage.rawPayload.split(/\r\n|\r|\n/)
				if(payloadLines.length == 2 && payloadLines[1].length == 0) {
					// todo: check for finsied=true flag
					logit("\tRecieved empty payload, sending same back (probably end of data).")
					process.stdout.write(workingMessage.rawHeader + "\n" + workingMessage.rawMetadata + workingMessage.rawPayload )

				} else {
					// We need to process the payload
					// copy the search info from our getInfoMessage to the data message
					workingMessage.inputSearchField 	= getinfoMessage.inputSearchField
					workingMessage.outputSearchField 	= getinfoMessage.outputSearchField
					workingMessage.operation 			= getinfoMessage.operation
					workingMessage.recipe 				= getinfoMessage.recipe
					workingMessage.b64recipe 			= getinfoMessage.b64recipe
					workingMessage.jsonRecipe 			= getinfoMessage.jsonRecipe
					// load recipes:
					if (workingMessage.recipe.length != 0) {
						logit("\tTrying to load Recipe from file: " + getinfoMessage.recipe)
						workingMessage.recipeJson = loadRecipesFromFile(getinfoMessage.recipe)
					}

					workingMessage.rawPayload = processPayload(workingMessage)
					workingMessage.payloadSize = workingMessage.rawPayload.length

					returnProcessedData(workingMessage)
				} 

				workingMessage.zeroize()
			} else {
				errorOut("Fatal Error in function process.stdin.on: Unknown message type: " + workingMessage.metadataCommand)
			}
		} else {
			logit ("\trecieved partial SplunkMessage, waiting for rest of message via stdin.")
			// we recieved a partial message, when we loop back through we'll build the rest of the message
			// (splunk doesn't write full messages to stdout in one big chunk)
		}
	}

}) // end process.stdin.on (readable)


