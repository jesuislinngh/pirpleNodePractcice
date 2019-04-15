/*

Create and export configuration variables

*/


// Container for all the environments
var environments = {};

// Statging(default) environment.
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashingSecret': 'thisIsASecret',
  'maxChecks': 5,
  'twilio' : {
    'accountSid' : 'AC535d3d5846c48069bfef3172ba80481d',
    'authToken' : '8984c13dc6e5e3a6fe80e5df09007774',
    'fromPhone' : '+14155552345'
  }
};
// Production environment.
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsAlsoASecret',
  'maxChecks': 5,
  'twilio' : {
    'accountSid' : 'AC535d3d5846c48069bfef3172ba80481d',
    'authToken' : '8984c13dc6e5e3a6fe80e5df09007774',
    'fromPhone' : '+14155552345'
  }
};

// Determine which environment was passed as command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) ==  'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current envronment is one of the environments above, if not, default to staging.
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
