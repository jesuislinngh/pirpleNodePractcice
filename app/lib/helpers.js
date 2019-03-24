/*
Helpers for various tasks
*/

// Dependencies
let crypto = require('crypto');
let config = require('./config');

// Container for all the helpers
let helpers ={};

helpers.hash = function(toHashValue) {

  if(typeof(toHashValue) == 'string' && toHashValue.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret).update(toHashValue).digest('hex');
  } else {
    return false;
  }

};

// Parse a json string to an object in all cases, without throwing
helpers.parseJsonToObject = function(value) {
  try {
    let parsedValue = JSON.parse(value);
    return parsedValue;
  } catch(exception) {
    console.error(exception);
    return {};
  }

};


// Export the module
module.exports = helpers
