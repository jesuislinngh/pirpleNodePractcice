var _data = require('./data');
var helpers = require('./helpers');

// stoped at 5:16
var handlers = {};

handlers.users = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstname, lastname, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
  let jsonParsedData = JSON.parse(data.payload);

  // Check that all required fields are filled out
  let firstname = typeof(jsonParsedData.firstname) == 'string' &&
   jsonParsedData.firstname.trim().length > 0 ?
    jsonParsedData.firstname.trim() : false;

  let lastname = typeof(jsonParsedData.lastname) == 'string' &&
   jsonParsedData.lastname.trim().length > 0 ?
    jsonParsedData.lastname.trim() : false;

  let phone = typeof(jsonParsedData.phone) == 'string' &&
   jsonParsedData.phone.trim().length == 10 ?
    jsonParsedData.phone.trim() : false;

  let password = typeof(jsonParsedData.password) == 'string' &&
   jsonParsedData.password.trim().length > 0 ?
    jsonParsedData.password.trim() : false;

  let tosAgreement = typeof(jsonParsedData.tosAgreement) == 'boolean' &&
   jsonParsedData.tosAgreement == true;

   if (firstname && lastname && phone && password && tosAgreement) {
     // Make sure te user doesn't exist
     _data.read('users', phone, function(err, data) {

       if (err) {
         // hash the password
         let hashedPassword = helpers.hash(password);

         if(hashedPassword) {

           // Create the user object
           let userObject = {
             'firstname': firstname,
             'lastname': lastname,
             'phone': phone,
             'hashedPassword': hashedPassword,
             'tosAgreement': true
           };

           // Store the user
           _data.create('users', phone, userObject, function(error) {

             if(!error) {
               callback(200);
             } else {
               console.error(error);
               callback(500, {'Error': 'Could not create the new user.'});
             }

           });

         } else {

           callback(500, {'Error': 'Could not hash the new user\'s password.'});

         }

       } else {
         callback(400, {'Error': 'A user with that phone number already exists'});

       }

     });
   } else {
     callback(200, {'Error': 'Missing fields required.'});
   }
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO: Only let authenticated users access their object, Don't let them access anyone elses
handlers._users.get = function(data, callback) {
  let phone =
   typeof(data.queryStringObject.phone) == 'string' &&
    data.queryStringObject.phone.trim().length == 10 ?
     data.queryStringObject.phone.trim() : false;

  if(phone) {

    // Get the token from the headers.
    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token from the headers is  valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(valid) {

      if(valid) {

        _data.read('users', phone, function(error, data) {

          if(!error && data) {
            // remove the hashed password from the user object before returnning it to the requester
            delete data.hashedPassword;
              callback(200, data);
          } else {
            callback(404);
          }

        });

      } else {
        callback(403, {'Error': 'Token missing in header, or token is invalid.'});
      }

    });

  } else {
    callback(400, {'Error': 'Missing fields required.'});
  }
};

// Users - put
// Required data: phone
// Optional data: firstname, lastname, password, (at least one must be specified)
// @TODO: Only let authenticated users update their object, Don't let them update anyone elses
handlers._users.put = function(data, callback) {

  let jsonParsedData = JSON.parse(data.payload);

  // check for the required field
  let phone =
   typeof(jsonParsedData.phone) == 'string' &&
    jsonParsedData.phone.trim().length == 10 ?
     jsonParsedData.phone.trim() : false;

  // check for the optional fields
  let firstname = typeof(jsonParsedData.firstname) == 'string' &&
   jsonParsedData.firstname.trim().length > 0 ?
    jsonParsedData.firstname.trim() : false;

  let lastname = typeof(jsonParsedData.lastname) == 'string' &&
   jsonParsedData.lastname.trim().length > 0 ?
    jsonParsedData.lastname.trim() : false;

  let password = typeof(jsonParsedData.password) == 'string' &&
   jsonParsedData.password.trim().length > 0 ?
    jsonParsedData.password.trim() : false;

  // Error if the phone is invalid
  if(phone) {
    // Get the token from the headers.
    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token from the headers is  valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(valid) {

      if(valid) {

        // Error if nothing is sent to update.
        if(firstname || lastname || password) {
          // lookup the user
          _data.read('users', phone, function(error, data) {

            if(!error && data) {

              if(firstname)
                data.firstname = firstname;

              if(lastname)
                data.lastname = lastname;

              if(password)
                data.hashedPassword = helpers.hash(password);

              // Store the new updates
              _data.update('users', phone, data, function(error) {

                if(!error) {
                  callback(200);
                } else {
                  console.error(error);
                  callback(500, {'Error': 'Could not update the user.'});
                }

              });

            } else {
              callback(400, {'Error': 'User does not exist.'});
            }

          });
        } else {
          callback(400, {'Error': 'Nothing to update.'});
        }

      } else {
        callback(403, {'Error': 'Token missing in header, or token is invalid.'});
      }

    });

  } else {
    callback(400, {'Error': 'Missing fields required.'});
  }

};

// Users - delete
// Required data: phone
// @TODO: Only let authenticated users delete their object, Don't let them delete anyone elses
// @// TODO: Cleanup(delete) any other data files associate it with this user
handlers._users.delete = function(data, callback) {
  // Check that the phone number provided is validcallback(200);
    let phone =
     typeof(data.queryStringObject.phone) == 'string' &&
      data.queryStringObject.phone.trim().length == 10 ?
       data.queryStringObject.phone.trim() : false;

    if(phone) {

      // Get the token from the headers.
      let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      // Verify that the given token from the headers is  valid for the phone number
      handlers._tokens.verifyToken(token, phone, function(valid) {

        if(valid) {

          _data.delete('users', phone, function(error) {

            if(!error) {
                callback(200);
            } else {
              callback(500, {'Error': 'Could not delete user.'});
            }

          });

        } else {
          callback(403, {'Error': 'Token missing in header, or token is invalid.'});
        }

      });

    } else {
      callback(400, {'Error': 'Missing fields required.'});
    }
};

// Tokens
handlers.tokens = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens post
// Required: phone, password
handlers._tokens.post = function (data, callback) {
  let jsonParsedData = JSON.parse(data.payload);

  let phone = typeof(jsonParsedData.phone) == 'string' &&
   jsonParsedData.phone.trim().length == 10 ?
    jsonParsedData.phone.trim() : false;

  let password = typeof(jsonParsedData.password) == 'string' &&
   jsonParsedData.password.trim().length > 0 ?
    jsonParsedData.password.trim() : false;

  if(phone && password) {
    // Look up the user who matches that phone number
    _data.read('users', phone, function(error, data) {

      if(!error && data) {
        // Hash the sent password and compare it to the stored in the user's password.
        let hashedPassword = helpers.hash(password);

        if(hashedPassword == data.hashedPassword) {
          // If valid create a new token with a random name, set experiration to one hour in the future
          let tokenId = helpers.createRandomString(20);
          let expires = Date.now() + 1000 * 60 * 60;

          let tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function(error) {

            if(!error) {
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not create the new token.'});
            }

          });

        } else {

          callback(400, {'Error': 'Passwords do not match'});

        }


      } else {
        callback(400, {'Error': 'Could find the given user'});
      }

    });
  } else {
    callback(400, {'Error': 'Invalid phone or password'});
  }

};

// Tokens get
// Required: id
handlers._tokens.get = function (data, callback) {

  let id =
   typeof(data.queryStringObject.id) == 'string' &&
    data.queryStringObject.id.trim().length == 20 ?
     data.queryStringObject.id.trim() : false;

  if(id) {
    _data.read('tokens', id, function(error, data) {

      if(!error && data) {
          callback(200, data);
      } else {
        callback(404, {'Error': 'Token not found.'});
      }

    });
  } else {
    callback(400, {'Error': 'Missing fields required.'});
  }

};

// Tokens put
// Required fields: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  let jsonParsedData = JSON.parse(data.payload);

  let id = typeof(jsonParsedData.id) == 'string' &&
   jsonParsedData.id.trim().length == 20 ?
    jsonParsedData.id.trim() : false;

  let extend = typeof(jsonParsedData.extend) == 'boolean'?
    jsonParsedData.extend : false;

  if(id && extend) {
    //lookup the token
    _data.read('tokens', id, function(error, data) {

      if(!error && data) {

        if(data.expires > Date.now()) {
          // Set the expiration an hour from now.
          data.expires = Date.now() * 1000 * 60 * 60;

          _data.update('tokens', id, data, function(error) {

            if(!error) {
              callback(200);
            } else {
              callback(500, {'Error': 'Could not update token\'s expiration.'});
            }

          });

        } else {
          callback(400, {'Error': 'The token has already expired, and cannot be extended.'});
        }

      } else {
        callback(400, {'Error': 'specified token does not exist.'});
      }

    });

  } else {
    callback(400, {'Error': 'Missing field(s) required or field(s) are invalid.'});
  }


};

// Tokens delete
handlers._tokens.delete = function (data, callback) {

  let id =
   typeof(data.queryStringObject.id) == 'string' &&
    data.queryStringObject.id.trim().length == 20 ?
     data.queryStringObject.id.trim() : false;

  if(id) {
    _data.read('tokens', id, function(error, data) {

      if(!error && data) {

        _data.delete('tokens', id, function(error) {

          if(!error) {
              callback(200);
          } else {
            callback(404, {'Error': 'Error when deleting token.'});
          }

        });

      } else {
        callback(404, {'Error': 'Token not found.'});
      }

    });
  } else {
    callback(400, {'Error': 'Missing fields required.'});
  }

};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {

  _data.read('tokens', id, function(error, data){

    if(!error && data) {

      // Check that the token is for the given tokens and it has not expire
      if(data.phone == phone && data.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }

    } else {
      callback(false);
    }

  });

};

handlers.ping = function(data, callback) {
  callback(200);
};

handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
