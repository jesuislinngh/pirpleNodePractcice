/*
Primarey file for the API
*/

//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// The server should respond to all requests with a string
var httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// Start the server
httpServer.listen(config.httpPort, function() {
  console.log("The server is listenning on port " + config.httpPort + " now in " + config.envName );
});

// Instantiate the https createServer
var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

// Start the https server
httpsServer.listen(config.httpsPort, function() {

  console.log("The server is listenning on port " + config.httpsPort + " now in " + config.envName );
});

var handlers = {};

handlers.ping = function(data, callback) {
  callback(200);
};

handlers.notFound = function(data, callback) {
  callback(404);
};

var router = {
  'ping': handlers.ping
};

// All the server logic for both the http and https server
var unifiedServer = function(req, res) {
    // Get the url and parse it
    var parsedUrl = url.parse(req.url, true);
    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryObject = parsedUrl.query;

    // Get the http method
    var method = req.method.toLowerCase();

    // Get request headers
    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data) {
      buffer += decoder.write(data);

    });

    req.on('end', function() {
      buffer += decoder.end();
      console.log("Returnning response:", trimmedPath);
      // Choose the handler this request should go to. If one is not found, use the not found handler
      var chosenHandler =
       typeof(router[trimmedPath]) != undefined ?
        router[trimmedPath] : handlers.notFound;

      var data = {
        'trimmedPath': trimmedPath,
        'queryStringObject': queryObject,
        'method': method,
        'headers': headers,
        'payload': buffer
      };

      chosenHandler(data, function(statusCode, payload) {

        // use the status code called back by a the handle, or default to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
        // Use the payload called back by the handler or default to an empty object
        payload = typeof(payload) == 'object' ? payload : {};

        // Convert the payload to a string_decoder
        var payloadString = JSON.stringify(payload);

        // Return the response.
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        // Send the response
        res.end(payloadString);

        // log the requests path
        console.log("Returnning response:", statusCode, payloadString, path, queryObject);

      });
    });
};
