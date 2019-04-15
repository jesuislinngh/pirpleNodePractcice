/*
Helpers for various tasks
*/

// Dependencies
let crypto = require('crypto');
let config = require('./config');
let https = require('https');
let querystring = require('querystring');

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

// send an sms message via twilio
helpers.sendTwilioSms = function(phone, message, callback) {

  // Validate parameters
  phone =
   typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;

  msg =
   typeof(message) == 'string' &&
    message.trim().length > 0 &&
     message.trim().length <= 1600 ? message.trim() : false;

  if(phone && msg) {

    // Configure the request payload
    let payload = {
      'From': config.twilio.fromPhone,
      'To': '+52' + phone,
      'Body': msg
    };

    // Stringfy the payload
    let stringPayload = querystring.stringify(payload);

    // Configure the request details
    let requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth' : config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers' : {
        'Content-Type' : 'application/x-www-from-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    let req = https.request(requestDetails, function(res) {
      // Grab the status of the sent request
      let status = res.statusCode;
      // Callback succesfully if the request went through
      if(status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code:' + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(error) {
      callback(error);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();

  } else {
    callback('Missing or invalid parameters.');
  }

};

// Export the module
module.exports = helpers
