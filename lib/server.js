/* 
 * Srver related tasks
 *
 */

// Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
// var _data = require('./data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

// Instanitate the server module object
var server = {};

// @TODO get rid of this
// helpers.sendTwilioSms('000000000', 'hello', function (err) {
//     console.log('error ', err);
// });

// TESTING create data and read
// create
// _data.create('test','newFile',{'foo':'bar'},function(err){
//     console.log('this was the error',err);
// });
// read
// _data.read('test','newFile',function(err,data){
//     console.log('this was the error',err,' and this was the data ',data);
// });
//upadte
// _data.update('test','newFile',{'fizz':'buzz'},function(err){
//     console.log('this was the error',err);
// });
// delete
// _data.delete('test','newFile',function(err){
//     console.log('this was the error',err);
// });

// The server should respond to all requests with a string
server.httpServer = http.createServer(function (req, res) {

    // Get the URL and parse it
    var parseUrl = url.parse(req.url, true);

    // Get the path
    var path = parseUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringobject = parseUrl.query;

    // Get the HTTP Method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data); // append
    });
    req.on('end', function () {
        buffer += decoder.end();

        //Choose the handler this request should go to. If one is not found, user the notFound handler
        var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // If the request is within the public directory, user the public handler
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        // Construct the data object to send to the handeler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringobject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function (statusCode, payload, contentType) {
            // Determine the type of response (fallback to JSON)
            contentType = typeof (contentType) == 'string' ? contentType : 'json';

            // Use the status code called back by the handler, or default to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Retrun the response parts that are content specific
            var payloadString = '';
            if (contentType == 'json') {
                res.setHeader('Content-Type', 'application/json');
                payload = typeof (payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);
            }
            if (contentType == 'html') {
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof (payload) == 'string' ? payload : '';
            }
            if (contentType == 'favicon') {
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'css') {
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'png') {
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'jpg') {
                res.setHeader('Content-Type', 'image/jpeg');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'plain') {
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }

            // Return the repsonse parts that are common to all content types
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log('Retruning this repsonse: ', statusCode, payloadString);

        });

        // Send the response
        // res.end('Hello world!\n');

        // Log tthe request path
        // console.log('Request recived with this payload', buffer); // send body
    });

    // payload crashes it... check it or delete payload
    // console.log('Request recived on path: ' + trimmedPath + ' with method ' + method + ' and with these query string parameters', queryStringobject);
    // console.log('Request recived with these headers', headers);

});

// Define a request router
server.router = {
    // 'sample': handlers.sample
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit': handlers.checksEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    'favicon.ico': handlers.favicon,
    'public': handlers.public
};

// Init script
server.init = function () {
    // Start the http server
    server.httpServer.listen(config.port, function () {
        console.log('\x1b[31m%s\x1b[0m', 'The server is listening on port ' + config.port + ' in ' + config.envName + ' mode');
    });

    // @TODO Start the https server
};

// Export the module
module.exports = server;