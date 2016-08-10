
var request = require("request"),
    program = require('commander'),
    //progress = require('progress'),
    url = require('url'),
    _ = require('underscore'),
    inquirer = require('inquirer'),
    cheerio = require('cheerio');

function parseURL(host) {
  
  if(!host) {
    return null;  
  }

  var urlObj = url.parse(host);
  
  if(!urlObj.protocol){
    urlObj.protocol = 'http';
  }
  if(!urlObj.host){
    urlObj.host = 'localhost';
  }
  if(!urlObj.port){
    urlObj.port = '8004';
  }
  return url.format(urlObj);
}

program
  .version('0.0.1')
  .option('-u, --url <n>', 'http://server:port', parseURL)
  //.option('-a, --add', 'add new user')
  //.option('-d, --del', 'delete existed user')
  .parse(process.argv);

if(!program.url) {
    program.help();
    process.exit(1);
}

var login_parameters = [
    {
      type: 'input',
      name: 'user',
      message: 'Enter login user name:',
      validate: function (str) {
        return !_.isEmpty(str);
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter login user password:',
      validate: function (str) {
        return !_.isEmpty(str);
      }
    }
];

var signup_parameters = [
    {
      type: 'input',
      name: 'user',
      message: 'Enter new user name:',
      validate: function (str) {
        return !_.isEmpty(str);
      }
    },
    { 
      type: 'password',
      name: 'password',
      message: 'Enter new user password:',
      validate: function (str) {
        return !_.isEmpty(str);
      }
    },
    {
      type: 'password',
      name: 'password_again',
      message: 'Once again, enter new user password:',
      validate: function (str, response) {
        return !_.isEmpty(str) && str == response.password;
      }
    }
];

var change_parameters = [
    { 
      type: 'password',
      name: 'password',
      message: 'Enter a new password (>=5 characters):',
      validate: function (str) {
        return !_.isEmpty(str) && str.length>=5;
      }
    },
    {
      type: 'password',
      name: 'password_again',
      message: 'Once again, enter the new password:',
      validate: function (str, response) {
        return !_.isEmpty(str) && str == response.password;
      }
    }
];

var delete_parameters = [
    {
      type: 'input',
      name: 'user',
      message: 'Enter user name to be deleted:',
      validate: function (str) {
        return !_.isEmpty(str);
      }
    },
    { 
      type: 'confirm',
      name: 'confirm',
      message: 'Are you confirm to delete the user?',
      validate: function (str) {
        return !_.isEmpty(str);
      }
    }
];

var function_parameters = [
    {
      type: 'list',
      name: 'func',
      message: 'select one action (Add user, Delete user, Change Password, Logout, Exit)?',
      choices: ['Add an new user','Delete an existed user', new inquirer.Separator(), 'Change password of current user'/*, 'Logout', 'Exit'*/],
      validate: function (str) {
        return !_.isEmpty(str);
      },
      filter: function (str){
        return str.split(' ')[0].toLowerCase();
      }
    }
];

var cookieJar = request.jar();

request({url: program.url, method: 'GET', jar: cookieJar}, function(e, r, html){
  if(!e && r.statusCode == 200 ) {
    var $ = cheerio.load(html),
        token= $('meta[name="csrf-token"]').attr('content');
    inquirer.prompt(login_parameters).then(function(parameters) {
      //console.log(parameters);
      loginUser(parameters, token);
    });
  } else {
    console.log(e || r.body);
  }
});

function loginUser(parameters, token) {
  var options = {
    method: 'POST',
    json: true,
    jar: cookieJar,
    body: {
      userId: parameters.user,
      password: parameters.password,
    },
    url: program.url+'api/auth/login',
    headers: {'X-CSRF-Token': token }
  };

  request(options, function(e, r, body){
    if(e || body.error) {
      console.error(e || body.error);
      process.exit(1);
    } else {
      var bexit = false;
      //while(!bexit) {
      inquirer.prompt(function_parameters).then(function(fparameters) {
          switch (fparameters.func) {
            case 'add':
              inquirer.prompt(signup_parameters).then(function(parameters) {
                signupNewUser(parameters, token);
              });
              break;

            case 'delete':
              inquirer.prompt(delete_parameters).then(function(parameters) {
                deleteUser(parameters, token);
              });
              break;
            
            case 'change':
              inquirer.prompt(change_parameters).then(function(parameters) {
                changePassword(parameters, token);
              });
              break;
            
            case 'logout':
              logoutUser(token);
              break;
              
            case 'exit':
              bexit = true;
              break;
            default:
              break;
          }
        });
      }
    //}
  });
}

function signupNewUser(parameters, token) {
  var options = {
    method: 'POST',
    json: true,
    jar: cookieJar,
    body: {
      userId: parameters.user,
      password: parameters.password,
    },
    url: program.url+'api/auth/signup',
    headers: {'X-CSRF-Token': token }
  };
  request(options, function(e, r, body){
    if(e || r.statusCode !== 200) {
      console.error(e || body.error);
      //process.exit(1);
    } else {
      console.log('successful in adding new user :'  + parameters.user);
    }
  });
}

function deleteUser(parameters, token) {
  var options = {
    method: 'POST',
    json: true,
    jar: cookieJar,
    body: {
      user: parameters.user
    },
    url: program.url+'api/auth/remove',
    headers: {'X-CSRF-Token': token }
  };

  request(options, function(e, r, body){
    if(e || r.statusCode !== 200) {
      console.error(e || body.error);
      //process.exit(1);
    } else {
      console.log('successful in deleting user :'  + parameters.user);
    }
  });
}

function changePassword(parameters, token) {
  var options = {
    method: 'POST',
    json: true,
    jar: cookieJar,
    body: {
      password: parameters.password
    },
    url: program.url+'api/auth/update',
    headers: {'X-CSRF-Token': token }
  };

  request(options, function(e, r, body){
    if(e || r.statusCode !== 200) {
      console.error(e || body.error);
      //process.exit(1);
    } else {
      console.log('successful in updating password');
    }
  });
}

function logoutUser(token) {
  var options = {
    method: 'POST',
    json: true,
    jar: cookieJar,
    url: program.url+'api/auth/logout',
    headers: {'X-CSRF-Token': token }
  };
  request(options, function(e, r, body){
    if(e || r.statusCode !== 200) {
      console.error(e || body.error);
      //process.exit(1);
    } else {
      console.log('successful in Logout !' );
    }
  });
}