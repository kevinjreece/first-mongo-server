var fs = require('fs');
var http = require('http');
var url = require('url');

var ROOT_DIR = "html";
var GET_CITY = "/getcity";
var COMMENTS = "/comments";
var CITIES_FILE = "UTCityList.txt";

exports.server = http.createServer(function (req, res) {
	var url_obj = url.parse(req.url, true, false);
	//console.log(url_obj.pathname);
	if (url_obj.pathname == GET_CITY) {
		//console.log("In REST Service");
		var search = url_obj.query['q'];
		if (search == "") return;
		//console.log(search);
		var found = [];
		fs.readFile(CITIES_FILE, function(err, data) {
			if (err) throw err;
			cities = data.toString().split("\n");
			found = [];
			cities.forEach(function (city_name, index) {
				//console.log(city_name);
				var search_length = search.length;
				var city_pre = city_name.substring(0, search_length);
				//console.log(city_pre);
				if (city_pre == search) {
					//console.log(city_name);
					var city_obj = { city:city_name }
					found.push(city_obj);
				}
			});
			//console.log(found);
			res.writeHead(200);
			res.end(JSON.stringify(found));
		});
	}
	else if (url_obj.pathname == COMMENTS) {
		if (req.method === "GET") {
			var MongoClient = require('mongodb').MongoClient;
			MongoClient.connect("mongodb://localhost/weather", function(err, db) {
				if(err) throw err;
				db.collection("comments", function(err, comments){
					if(err) throw err;
					comments.find(function(err, items){
						items.toArray(function(err, itemArr){
							console.log("Document Array: ");
							console.log(itemArr);
							res.writeHead(200);
							res.end(JSON.stringify(itemArr));
						});
					});
				});
			});
		}
		if (req.method === "POST") {
			console.log("In Post");
			var jsonData = "";
     			req.on('data', function (chunk) {
     				jsonData += chunk;
			});
			req.on('end', function () {
				var reqObj = JSON.parse(jsonData);
				console.log(reqObj);
				console.log("Name: " + reqObj.Name);
				console.log("Comment: " + reqObj.Comment);
				var MongoClient = require('mongodb').MongoClient;
				MongoClient.connect("mongodb://localhost/weather", function(err, db) {
					if(err) throw err;
					db.collection('comments').insert(reqObj,function(err, records) {
						if (records) {
							console.log("Record added as " + records[0]._id);
						}
					});
				});
				res.writeHead(200);
				res.end();
			});
		}
	}
	else {
		fs.readFile(ROOT_DIR + url_obj.pathname, function (err,data) {
			if (err) {
				res.writeHead(404);
				res.end(JSON.stringify(err));
				return;
			}
			res.writeHead(200);
			res.end(data);
		});
	}
}).listen(80);



var options = {
    hostname: 'localhost',
    port: '80',
    path: '/hello.html'
  };
function handleResponse(response) {
  var serverData = '';
  response.on('data', function (chunk) {
    serverData += chunk;
  });
  response.on('end', function () {
    console.log(serverData);
  });
}
//http.request(options, function(response){
//  handleResponse(response);
//}).end();
