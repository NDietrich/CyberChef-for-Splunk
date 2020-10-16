
// v3: working, but no CSV functionality
// v4: csv working, field selection working
// v5: node working (with hard-coded command), comments added + cleanup
// v6: dynamic NODE workgin, refactored parameter parsing as well.
// v7: added error option and bake options
// v8: working on better loading of bake file, no luck.
// v9: nearly parser working (except for "" with spaces)
// v10: parser working, added compact json loaded from file, b64 commands
//		using grammar_v3.ne
//
//	Todo: Testing 

// //https://www.npmjs.com/package/csv-string
// npm install -s csv-string


//-------------------------------------
// 			DEBUG
//-------------------------------------



var fs = require('fs'); 
const logit = function (msg) { 	fs.appendFileSync('jsStdout.txt', msg + "\n", function (err) { if (err) throw err; }); }
// END DEBUG

//-----------------------------------------------------------------------------
//						Globals
//-----------------------------------------------------------------------------
//var recipes = {}	// all the recipes loaded from file ../recipes

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
	* @param {string}	rawHeader 		The header received in the message (may be partial)
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
	* @param {string} 	rawPayload			The entire payload (including column headers) as a single strings.
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

		this.rawPayload = ''
	}

	/*
	* Parse the metadata field (json as string) from a splunkOject.
	*	Determines the type of command (getinfo or action), as well as  
	*	the search parameters (which fields to read/write from payload).
	*	These values are saved within the splunkMessage object.
	*
	* @returns: nothing
	* @this: splunkMessage instance
	*/
	parseMetadata (){
		// Throw fatal error if actual metadata doesn't match the size in the header
		if(this.rawMetadata.length !=  this.metadataSize) { 
			errorOut("Fatal error in function parseMetadata: Attepmpt to parse incomplete message from Splunk.")
		}
		
		// parse metadata string JSON (this gives us the entire header, lots of useless fields)
		try {
			this.metadataCommand = (JSON.parse(this.rawMetadata)).action
		} catch (err) {
			errorOut("Fatal error in function parseMetadata: Error parsing metadata JSON for action field:" + err.message)
		}
		
	    if (this.metadataCommand == 'getinfo') {
	    	// get searchOptions and field names from metadta JSON
			try {
				var searchOptions = (JSON.parse(this.rawMetadata)).searchinfo.raw_args
			} catch (err) {
				errorOut("Fatal error in function parseMetadata: Error parsing metadata JSON for search options field:" + err.message)
			}


			// search string needs to be a string, not a half-assed array of kv pairs
			searchOptions = searchOptions.join(' ')

			//logit("Search Options are: " + searchOptions)

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
				errorOut("Error trying to parse input options: " +  err.message.split('\n')[0] )
			}
			
			var kvPairs = parser.results[0]

			// check which fields we got
			// we don't have to check oru input, as the parser nicely does that for us.
			for(var i = 0; i < kvPairs.length; i++){

				for (const [key, value] of Object.entries(kvPairs[i])) {
				  	//logit("K/V: " + key + "/" + value)
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
			errorOut("Fatal Error: unknown in metadata json: ", this.metadataCommand)
		}
	}

	/**
	* Take a string of data and use it to build our splunkMessage.
	*	data can come in chunks, so we assemble the message bit-by-bit
	*
	* @param {string}	data	the string containing data to add
	*/
	addData(data){
		// Check if the header is complete
		if(! this.completeHeader){
			// check if newline in data, if not we don't have a complete header
			if(data.split('/\r\n|\r|\n/')){
				data = data.split(/\r\n|\r|\n/)
				this.rawHeader += data
				var nul = data.shift()
				this.completeHeader = true

				// parse header for sizes of metadata and payload for this message
				var sizes = this.rawHeader.split(',')
				this.metadataSize  = sizes[1]
				this.payloadSize = sizes[2]

			} else {
				// we received a partial header, save it and return
				this.rawHeader += data
				return
			}

			if (data.length == 0) {reutrn}
		}

		// Check if the metatadata is complete (based on lenght provided by header)
		if(this.rawMetadata.length !=  this.metadataSize){
			//figure out how much data we need to fill the header
			var neededChars = this.metadataSize - this.rawMetadata.length
			if(data[0].length >= neededChars){
				// enough data exists to complete the header
				this.rawMetadata += data[0].substring(0,neededChars)
				data[0] = data[0].substring(neededChars)
				this.parseMetadata()

			} else {
				// not enough data recevied to fill header, take it all and return
				this.rawMetadata += data[0]
				//todo: sanity check, chunk.length should be 1
				return
			}
		}

		if (data[0].length == 0 || data[0] == null) {return}
		// anything else from the input is payload
		this.rawPayload = data.join('\n')

	} // END function addData()

	/**
	* re-initalize a splunkMessage back to defaults.
	*/
	zeroize() {
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
	}

	/**
	* Check a splunkMessage to see if it is a complete message.
	* 	for a GETINFO message, do we have full metadata
	*	for a EXECUTE message, do we have a full payload
	*
	@ return {boolean} If the splunkMessage is a complete message
	*/
	checkMessageComplete() {
		if(this.metadataCommand == 'getinfo') {
			if(this.completeHeader && (this.rawMetadata.length ==  this.metadataSize)) {return true}
			else {return false}
		} else if (this.metadataCommand == 'execute') {
			// bug: with large datasets, actual payload may be a little smaller than the advertised
			// datasize
			if (this.rawPayload.length + 5 >= this.payloadSize){return true} else {return false}
		}

	}

	/**
	* Partialy Clone a splunkMessage instance to a new splunkMessage instance.
	*	NOTE: only clones a few specific fields neede by the EXECUTE command
	*
	* @this: splunkMessage instance to clone
	* @return {splunkInstance} a new splunkMessage object
	*/
	cloneForExecute(){
		// only a few fields are needed for processing. copy those fields and return new object
		var x = new splunkMessage()
		x.inputSearchField =  this.inputSearchField 
		x.outputSearchField = this.outputSearchField
		x.operation = this.operation 
		x.recipe = this.recipe 
		x.recipeJson = this.recipeJson
		x.rawPayload = this.rawPayload
		x.b64recipe = this.b64recipe
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
	//const metadata = '{"action":"getinfo","finished":true,"error":"'  + msg +'"}'
	const metadata = '{"finished":true,"error":"'  + msg +'"}'
	const transportHeader = 'chunked 1.0,' + metadata.length + ",0\n"
	process.stdout.write(transportHeader)
	process.stdout.write(metadata)
	process.exit()
}

/*const messageUser = function(msg){
	// TODO: NOT WORKING.
	// send a GETINFO message back to the splunk server 
	// msg is the message to send back and display in splunk web.

	const metadata = '{"action":"getinfo","finished":true,"inspector":{"messages":[["WARN","avdsn asnosdn               "]]}}'
													  	// '{"inspector":{"messages":[["INFO","test command configuration: "]]}}\n'
	const transportHeader = 'chunked 1.0,' + metadata.length + ",0\n"

	process.stdout.write(transportHeader)
	process.stdout.write(metadata)
}*/

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
	// which field(s) do we require from splunk, as array of strings
	searchFields = [msg.inputSearchField]
	
	if (msg.outputSearchField != msg.inputSearchField ) {searchFields.push( msg.outputSearchField)} 

	try {
		jsonReply = JSON.stringify({
			type: "streaming",
			generating: false,
			required_fields:  searchFields
		})	
	} catch(err) {
		errorOut("Fatal Error in function sendGetInfo:  JSON Stringify error crafting GETINFO reply:" + err.message)
	}

	var transportHeaderReply = 'chunked 1.0,' + jsonReply.length + ',0'

	//logit("sending GETINFO: \n" + transportHeaderReply +"\n" + jsonReply)

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

	// metadata 'Finished' option should match that of Splunk's last message
	// if =true, then splunk will shutdown further processing

	// replace carriage returns (CRLF) if on windows since Splunk 
	// has problems processing large replies (1000 records) if there is a \r in it 
	data.rawPayload = data.rawPayload.replace(/(\r\n)/g, '\n');

	try {
		var finished = JSON.parse(data.rawMetadata).finished
	} catch (err) {
		errorOut("Fatal Error in function returnProcessedData:  JSON Stringify error crafting reply: " + err.message)
	}	
	if(finished ) {var metadata = '{"finished":true}'}
	else {var metadata = '{"finished":false}'}
	const transportHeader = 'chunked 1.0,' + metadata.length + ',' + (data.rawPayload.length) + "\n"

	process.stdout.write(transportHeader)
	process.stdout.write(metadata)
	process.stdout.write(data.rawPayload)
	//logit('============================================================================')
	//logit("Sending ACTION: " + transportHeader.trim() + ' ' + metadata +' size:' + data.rawPayload.length)
	//logit(data.rawPayload + "<<END>>")
	//logit('============================================================================')
}

/**
* Process the payload of a splunkMessage with cyberchef
*
* @param {splunkMessage} msg the splunkMessage to process
* @return {string} the results as a csv-formatted string
* @todo Make dynamic
*/
const processPayload = function(msg){
	// where the magic hapens. modify the payload here before returning it.
	//msg.print()
	// load cyberchef and csv-string modules. delayed so we don't load it for each GETINFO command which doesn't use it
	//logit(" ENTERING FUNCTION processPayload")
	try {
		var chef = require("cyberchef")
	} catch (err) {
		errorOut("Fatal Error in function processPayload:  Can't load module Cyberchef " + err.message + ", " + err.name)
	}
	logit("WORKING: " + module.paths)
	try {
		var CSV = require('csv-string')
	} catch (err) {
		errorOut("Fatal Error in function processPayload:  Can't load module csv-string " + err.message)
	}

	// take the raw payload (headers and data) from the message, convert to two-dimensional array
	// first row is the column names
	// each additional row is data to process
	try {
		var events = CSV.parse(msg.rawPayload)
	} catch (err) {
		errorOut("Fatal Error in function processPayload:  CSV.PARSE error on payload: " + err.message)
	}

	// determine which columns have the fields we need (input and output fields)
	var inIndex = events[0].indexOf(msg.inputSearchField)
	var outIndex = events[0].indexOf(msg.outputSearchField)
	if (inIndex == -1 || outIndex == -1) {errorOut("Fatal Error in function processPayload: bad index of input/output field.")}

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
	} else {
		//logit("parsing b64 string: " + msg.FromBase64)
		try{
			cmdToRun = chef.bake(msg.b64recipe, 'FromBase64' )
		}catch (err){
			errorOut('Can not process b64-encoded string. Error: ' + err.message)
		}

		//logit("operation is now: " + cmdToRun)
		try {
			cmdToRun = JSON.parse( cmdToRun)
		} catch (err){
			errorOut("Fatal Error in function processPayload: error during desearalize json from b64.  Error: " + err.name)
		}
	}

	// Iterate over each row of data (except header) and process with cyberchef
	//logit("events length is: " + events.length)
	for(var i = 1; i < events.length; i++){

		try {
			events[i][outIndex] = chef.bake(events[i][inIndex],  cmdToRun )		
		} catch (err) {
			errorOut("CyberChef " + err.message)
		}
	}

	// convert objects back to csv string and save back to our message
	try {
		return CSV.stringify(events)
	} catch (err) {
		errorOut("Fatal Error in function processPayload: Error converting results to CSV file. CSV.stringify error on return: " + err.message)
	}
}


const loadRecipesFromFile = function( recipeAliasToLoad ) {

	const recipeFolders = ['..//local//recipes//', '..//default//recipes//' ]

	//logit("\n\nLooking for recipe with alias: " + recipeAliasToLoad)

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
				//logit("Fatal Error in function loadRecipesFromFile: can't read file from recipe folder: "+ file + ": " + err.message)
			}
			//logit("checking file: " + file)
			if(content.length != 0){
				//logit("CONTENT: "+content)
				line = content.split(/\r?\n/);

				for(var i = 0; i< line.length; i++){
					// does the line start with a \w char (otherwise its a comment)
					if(line[i].charAt(0).search(/\W/i)) {
						// split the line at the first colon found, left side is the nickname, right side is the json recipe
						var recipeName = line[i].substr(0,line[i].indexOf(':')).trim()
						var recipeCode = line[i].substr(line[i].indexOf(':')+1).trim()
						//logit("FOUND: name/code: " +recipeName +"/"+recipeCode)
						if (recipeName == recipeAliasToLoad) {
							//logit("RETURING JSON: "+recipeCode)
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

//var messages = []	// an array that holds all complete splunkMessages (header, metadata, payload) recieved
var workingMessage = new splunkMessage()	// the partial splunkMessage we have recieved

var getInfoMessage 		// a complete GETINFO message with search information
//var executeMessage 		// a complete EXECUTE message with data to process

//https://stackoverflow.com/questions/26174308/what-are-the-differences-between-readable-and-data-event-of-process-stdin-stream
process.stdin.setEncoding('utf8')
process.stdin.on('readable', () => {

	//logit('-----------------------------------------------------------------------------')
	// receive whatever data is in stdin
	var chunk = process.stdin.read();

	if (chunk == null) { return }
	//logit("Received Data Chunk: \n" + chunk + "<<EOF>>")

	// process chunk	
	workingMessage.addData(chunk)
	if (workingMessage.checkMessageComplete()){
		// if packet is getinfo, send capabilities reply
		//logit("recieved Complete Message: " + workingMessage.metadataCommand)
		if(workingMessage.metadataCommand == 'getinfo'){
			sendGetInfo(workingMessage)
			getinfoMessage = workingMessage.cloneForExecute()
			workingMessage.zeroize()
			return
		} else if(workingMessage.metadataCommand == 'execute') {
			
			// copy the search info from our getInfoMessage to the data message
			workingMessage.inputSearchField 	= getinfoMessage.inputSearchField
			workingMessage.outputSearchField 	= getinfoMessage.outputSearchField
			workingMessage.operation 			= getinfoMessage.operation
			workingMessage.recipe 				= getinfoMessage.recipe
			workingMessage.b64recipe 			= getinfoMessage.b64recipe

			// load recipes:
			if (workingMessage.recipe.length != 0) {
				//logit("loading Reipes from file...." + getinfoMessage.recipe)
				workingMessage.recipeJson = loadRecipesFromFile(getinfoMessage.recipe)
			}
			
			//workingMessage.print()

			workingMessage.rawPayload = processPayload(workingMessage)
			workingMessage.payloadSize = workingMessage.rawPayload.length

			returnProcessedData(workingMessage)
			workingMessage.zeroize()
		} else {
			errorOut("Fatal Error in function process.stdin.on: Unknown message type: " + workingMessage.metadataCommand)
		}
	}

}) // end process.stdin.on (readable)


//process.stdin.on('end', () => {
 // // nothing to do
//})

