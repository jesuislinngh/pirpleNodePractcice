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

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(length) {

  length = typeof(length) == 'number' && length > 0 ? length : false;

  if(length) {
    // Define all the possible characters that could go into a string
    let characters = 'abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ1234567890';

    // start the tokens
    let token = '';

    for(let i = 1; i <= length; i++) {
      // get a random character from the possible character
      // append this character to the random string
      let random = characters.charAt(Math.floor(Math.random() * characters.length));
      token += random;
    }

    return token;
  } else {
    return false;
  }

};

// Export the module
module.exports = helpers
