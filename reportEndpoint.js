// Configuration
var serverPort = 8080;
var serverIP = '127.0.0.1';

var http = require('http');
var qs = require('querystring');
var fs = require('fs');
var url = require('url')


// TODO Decide the format for the reports. JSON? Query strings?
// For now, four parameters. Name needs to be encoded and is undecided.
// steam64
// ability_used
// room
// level



// TODO Something with this report file.
var reportFile = fs.open('report', 'a+');

console.log('Starting server');
http.createServer(reqHandler).listen(serverPort, serverIP);

function reqHandler(request, response) {
	var parsedUrl = url.parse(request.url);

	if (request.method == 'POST' && parsedUrl.pathname == '/report'){
		var report = parseReport(request);

		console.log(report);
		handleReport(report);

		// TODO Headers?
		response.setHeader('Access-Control-Allow-Origin', '*');

		response.end();
	} else {
		response.statusCode = 400;
		response.end();
	}
}

// Parse the report. Right now, a bit redundant.
function parseReport(request){
	var report = qs.parse(request.url.query);
	// TODO validate report and error checking.
	return report;
}

// Deals with the resulting report.
function handleReport(report){
	// TODO Format report and save it somewhere.
	console.log(report);
}