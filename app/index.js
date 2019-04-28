/*
Primarey file for the API
*/

// Dependencies
let server = require('./lib/server');
let workers = require('./lib/workers');

// Declare the app
let app = {};

// Apps init function
app.init = function() {

  // Start the server
  server.init();

  // Start the workers
  workers.init();
};


// Execute the app
app.init();

// Export the app
module.exports = app;
