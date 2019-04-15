var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

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
handlers._users.delete = function(data, callback) {
  // Check that the phone number provided is validcallback(200);
    let phone =
     typeof(data.queryStringObject.id) == 'string' &&
      data.queryStringObject.id.trim().length == 10 ?
       data.queryStringObject.id.trim() : false;

    if(phone) {

      // Get the token from the headers.
      let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      // Verify that the given token from the headers is  valid for the phone number
      handlers._tokens.verifyToken(token, phone, function(valid) {

        if(valid) {

          _data.read('users', phone, function(error, userData) {

            if(!error && userData) {

              _data.delete('users', userData.phone, function(error) {

                if(!error) {
                    // Delete all checks of this users.callback(200);
                    let checks = typeof(userData.checks) == 'object' &&
                    userData.checks instanceof Array ? userData.checks : [];

                    if(checks) {

                      let total = checks.length;
                      let deletedChecks = 0;
                      let errors = false;

                      checks.forEach(function(check) {

                        _data.delete('checks', check, function(error) {

                          if(error) {
                            errors = true;
                          }

                          deletedChecks++;
                          if(deletedChecks == total) {
                            if(!errors) {
                              callback(200);
                            } else {
                              callback(500, {'Error': 'Could not delete some user\'s checks.'});
                            }
                          }

                        });

                      });

                    } else {
                      callback(200);
                    }


                } else {
                  callback(500, {'Error': 'Could not delete user.'});
                }

              });

            } else {
              callback(404, {'Error': 'User not found'});
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

// Checks
handlers.checks = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCode, timeoutSeconds
// Optional data: none
handlers._checks.post = function(data, callback) {
  // Validate inputs
  let jsonParsedData = JSON.parse(data.payload);

  let protocol = typeof(jsonParsedData.protocol) == 'string' &&
   ['http', 'https'].indexOf(jsonParsedData.protocol) > -1 ?
    jsonParsedData.protocol : false;

  let url = typeof(jsonParsedData.url) == 'string' &&
   jsonParsedData.url.trim().length > 0 ?
    jsonParsedData.url.trim() : false;

  let method = typeof(jsonParsedData.method) == 'string' &&
   ['post', 'get', 'put', 'delete'].indexOf(jsonParsedData.method) > -1 ?
    jsonParsedData.method : false;

  let codes = typeof(jsonParsedData.codes) == 'object' &&
   jsonParsedData.codes instanceof Array &&
   jsonParsedData.codes.length > 0 ?
    jsonParsedData.codes : false;

  let timeout = typeof(jsonParsedData.timeout) == 'number' &&
   jsonParsedData.timeout % 1 == 0 &&
    jsonParsedData.timeout > 0  &&
     jsonParsedData.timeout < 6?
    jsonParsedData.timeout : false;

  if(protocol && url && method && codes && timeout) {
    // get the token from the headers
    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // lookup the user by reading the token.
    _data.read('tokens', token, function(error, data) {

      if(!error && data) {
        let phone = data.phone;

        // lookup the data
        _data.read('users', phone, function(error, userData){

          if(!error && userData) {

            let checks =
             typeof(userData.checks) == 'object' && userData.checks instanceof Array ?
              userData.checks : [];

            // Verify that the user has less than the number of max-checks-per-user
            if(checks.length < config.maxChecks) {
              // Create a random id for the checks
              let id = helpers.createRandomString(20);

              // Create the check object, and include the user's phone
              let checkObject = {
                'id': id,
                'phone': phone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'codes': codes,
                'timeout': timeout
              };

              // Save the object
              _data.create('checks', id, checkObject, function(error) {

                if(!error) {
                  // Add the check id to the user's object
                  userData.checks = checks;
                  userData.checks.push(id);

                  // Save the new user data
                  _data.update('users', phone, userData, function(error){

                    if(!error) {
                      // Return the new check data
                      callback(200, checkObject);

                    } else {
                      callback(500, {'Error': 'Could not update user.'});
                    }

                  });

                } else {
                  callback(500, {'Error': 'Could not create new check.'});
                }

              });

            } else {
              callback(404, {'Error': 'Maximum checks reached'});
            }

          } else {
            callback(403);
          }

        });

      } else {
        callback(403);
      }

    });
  } else {
    callback(400, {'Error': 'Missing required info, or info invalid.'});
  }

};

// Checks - get
// Required data: check id
// Optional data: none
handlers._checks.get = function(data, callback) {
  let id =
   typeof(data.queryStringObject.id) == 'string' &&
    data.queryStringObject.id.trim().length == 20 ?
     data.queryStringObject.id.trim() : false;

   if(id) {

     _data.read('checks', id, function(error, checkData) {

       if(!error && checkData) {
         // Get the token from the headers.
         let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
         // Verify that the given token from the headers is valid for the user who created the check
         handlers._tokens.verifyToken(token, checkData.phone, function(valid) {

           if(valid) {
             callback(200, checkData);
           } else {
             callback(403, {'Error': 'Token missing in header, or token is invalid.'});
           }

         });

       } else {
         callback(404);
       }

     });

   } else {
     callback(400, {'Error': 'Missing fields required.'});
   }
};

// Checks - put
// Required data: check id
// Optional data: protocol, url, method, code, timeout, one must be send
handlers._checks.put = function(data, callback) {

  let jsonParsedData = JSON.parse(data.payload);

  // check for the required field
  let id =
   typeof(jsonParsedData.id) == 'string' &&
    jsonParsedData.id.trim().length == 20 ?
     jsonParsedData.id.trim() : false;

  // Check make sure id is invalid
  let protocol = typeof(jsonParsedData.protocol) == 'string' &&
  ['http', 'https'].indexOf(jsonParsedData.protocol) > -1 ?
   jsonParsedData.protocol : false;

  let url = typeof(jsonParsedData.url) == 'string' &&
  jsonParsedData.url.trim().length > 0 ?
   jsonParsedData.url.trim() : false;

  let method = typeof(jsonParsedData.method) == 'string' &&
  ['post', 'get', 'put', 'delete'].indexOf(jsonParsedData.method) > -1 ?
   jsonParsedData.method : false;

  let codes = typeof(jsonParsedData.codes) == 'object' &&
  jsonParsedData.codes instanceof Array &&
  jsonParsedData.codes.length > 0 ?
   jsonParsedData.codes : false;

  let timeout = typeof(jsonParsedData.timeout) == 'number' &&
  jsonParsedData.timeout % 1 == 0 &&
   jsonParsedData.timeout > 0  &&
    jsonParsedData.timeout < 6?
   jsonParsedData.timeout : false;

  // Check if the id fields is valid
  if(id) {

    // Check to make sure one or more optinal fields have been sent
    if(protocol || url || method || codes || timeout) {
      // Lookup the check
      _data.read('checks', id, function(error, checkData) {

        if(!error && checkData) {

          // Get the token from the headers.
          let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token from the headers is  valid for the phone number
          handlers._tokens.verifyToken(token, checkData.phone, function(valid) {

            if(valid) {
              // Update the check where necessary
              if(protocol) {
                checkData.protocol = protocol;
              }

              if(url) {
                checkData.url = url;
              }

              if(codes) {
                checkData.codes = codes;
              }

              if(codes) {
                checkData.codes = codes;
              }

              if(timeout) {
                checkData.timeout = timeout;
              }

              // Store the new updates
              _data.update('checks', id, checkData, function(error) {
                if(!error){
                  callback(200);
                } else {
                  callback(500, {'Error': 'Could not update'});
                }
              });

            } else {
              callback(403, {'Error': 'Token missing in header, or token is invalid.'});
            }

          });
        } else {
          callback(400, {'Error': 'Id does not exists.'});
        }

      });
    } else {
      callback(400, {'Error': 'nothing to update.'});
    }

  } else {
    callback(400, {'Error': 'Missing fields required.'});
  }

};

// Checks - delete
// Required data: check id
// Optional data: none
handlers._checks.delete = function (data, callback) {

  let id =
   typeof(data.queryStringObject.id) == 'string' &&
    data.queryStringObject.id.trim().length == 20 ?
     data.queryStringObject.id.trim() : false;

  if(id) {

    // lookup the check
    _data.read('checks', id, function(error, checkData) {

      if(!error && checkData) {

        // Get the token from the headers
        let token = typeof(data.headers.token) == 'string' &&
          data.headers.token.length == 20 ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, checkData.phone, function(valid){

          if(valid) {
            // Delete the check data
            _data.delete('checks', id, function(error) {

              if(!error) {

                _data.read('users', checkData.phone, function(error, userData) {

                  if(!error && userData) {

                    let checks = typeof(userData.checks) == 'object' &&
                      userData.checks instanceof Array ? userData.checks : [];

                    let position = checks.indexOf(id);

                    if(position > -1) {
                      checks.splice(position, 1);
                      userData.checks = checks;

                      // Upate the user's data.
                      _data.update('users', userData.phone, userData, function(error) {
                        if(!error){
                          callback(200);
                        } else {
                          callback(500, {'Error': 'Could not user\'s checks'});
                        }
                      });

                    } else {
                      callback(500, {'Error': 'Check not found.'});
                    }

                  } else {
                    callback(500, {'Error': 'User not found.'});
                  }

                });

              } else {
                callback(500, 'Could not delete the check data');
              }

            });

          } else {
            callback(403);
          }

        });

      } else {
        callback(400, {'Error': 'Id not found.'});
      }

    });

  } else {
    callback(400, {'Error': 'Missing fields required.'});
  }

};


handlers.ping = function(data, callback) {
  callback(200);
};

handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
