// Configuration
var serverPort = 8080;
var serverIP = "127.0.0.1";

var http = require("http");
var qs = require("querystring");
var fs = require("fs");
var url = require("url");
var sqlite3 = require("sqlite3").verbose();


// TODO Decide the format for the reports. JSON? Query strings?
// See https://github.com/wchill/MSG_Whitelist/wiki/Data-and-interactions.
// For now, four parameters. Name needs to be encoded and is undecided.
// steam64
// ability_used
// room
// level



// TODO Something with this report file.
var file = "report.sqlite";
var exists = fs.existsSync(file);

console.log("Starting server");
var db = new sqlite3.Database(file);

if(!exists) {
	db.run("CREATE TABLE 'players' ('id' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE, " +
									"'steamid' INTEGER UNIQUE," +
									"'name' TEXT)");

	db.run("CREATE TABLE 'reports' ('report_id' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE, " +
									"playerid INTEGER" +
									"'round' INTEGER," +
									"'ability' INTEGER, " +
									"'time' DATETIME," +
									"FOREIGN KEY(playerid) REFERENCES players(id))");
}


http.createServer(reqHandler).listen(serverPort, serverIP);

function reqHandler(request, response) {
	var parsedUrl = url.parse(request.url);

	if (request.method === "POST" && parsedUrl.pathname === "/report"){
		var requestData = "";
		// load Data
		request.on("data", function (data) {
			requestData += data;
			// Throw out anything too long.
			if (requestData.length > 1e6){
				requestData = "";
				response.statusCode = 413;
				request.connection.destroy();
			}
		});

		var report = "";
		request.on("end", function(){
			report = JSON.parse(requestData);
			console.log(report);
		});
		if (validateReport(report)){
			handleReport(report);
		}

		// TODO Other headers?
		response.setHeader("Access-Control-Allow-Origin", "*");

		response.end();
	} else {
		response.statusCode = 400;
		response.end();
	}
}

// TODO Properly validate incoming data.
function validateReport(report){
	return true;
}

// Deals with the resulting report.
function handleReport(report){
	console.log(report);
	db.serialize(function(){
		var stmt = db.prepare("SELECT id FROM players WHERE 'steamid' == ?");
		var id; // Row id for player.
		var error = false;
		stmt.get(report.steamid, function (err, row){
			if (row){
				console.log(row);
				id = row.id;
			} else {
				// Not in database, so add them to the table.
				stmt = db.prepare("INSERT INTO players (steamid) VALUES (?)");
				stmt.run(report.steamid, function(err2){
					if (err2){
						error = true;
					} else {
						id = this.lastID;
					}
				});
			}
		});
		// At this point, either error is true or id is the key we want.
		if (!error){
			stmt = db.prepare("INSERT INTO reports (steamid, round, ability, time) VALUES (?, ?, ?, ?)");
			//TODO Maybe a check to see if this worked?
			stmt.run(id, report.round, report.ability, report.time);
		}
	});
}
