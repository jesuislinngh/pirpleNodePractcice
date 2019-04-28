/*
Library for storing and editing data
*/

// Dependencies
let fs = require('fs');
let path = require('path');
let helpers = require('../lib/helpers');

// Container
let lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = function(dir, file, data, callback) {

  // if directory doesn't exist, create one, if file doesn't exist, create one

  //open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor) {

    if(!err && fileDescriptor) {
      // Convert data to string
      var stringData = JSON.stringify(data);
      fs.writeFile(fileDescriptor, stringData, function(err) {
        if(!err) {
          fs.close(fileDescriptor, function(err) {
            if(!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback("Error writing to new file");
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }

  });

};


// Read data from a file
lib.read = function(dir, file, callback) {
  fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', function(error, data) {

    if(!error && data) {
      let parseData = helpers.parseJsonToObject(data);
      callback(false, parseData);
    } else {
      callback(error, data);
    }

  });
};

// Update date inside a file
lib.update = function(dir, file, data, callback) {
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(error, fileDescriptor) {
    if(!error) {
      var stringData = JSON.stringify(data);

      fs.ftruncate(fileDescriptor, function(error) {
        if(!error) {
          fs.writeFile(fileDescriptor, stringData, function(error) {
            if(!error) {
              fs.close(fileDescriptor, function(error) {
                if(!error) {
                  callback(false);
                } else {
                  callback("Error closing the file");
                }
              });
            } else {
              callback("Error writing to the file");
            }
          });
        } else {
          callback("Error truncating the file");
        }
      })
    } else {
      callback("Could not open the file for updating, it may not exist yet.");
    }
  });
};

// Deleting a file
lib.delete = function(dir, file, callback) {
  // Unlink the file
  fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(error) {
    if(!error) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  });
};

// List all the items in a directory
lib.list = function(dir, callback) {
  fs.readdir(lib.baseDir + dir + '/', function(error, data) {

    if(!error && data) {

      let files = [];

      data.forEach(function(file){
        files.push(file.replace('.json', ''));

      });
      callback(false, files);
    } else {
      callback(error, data);
    }

  });
};

//
module.exports = lib;
