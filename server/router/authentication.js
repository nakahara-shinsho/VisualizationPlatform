module.exports.authentication = function (router,db){
  var bcrypt        = require("bcrypt-nodejs"),
    _ = require("underscore");
  var super_user_id  = GLOBAL.config.get('FrontEnd.superuser.userId'),
      super_user_pwd = GLOBAL.config.get('FrontEnd.superuser.password');
 
  // Create our users table if it doesn't exist
  db.run("CREATE TABLE IF NOT EXISTS users ( " +
         " userId TEXT UNIQUE PRIMARY KEY, password TEXT, auth_token TEXT UNIQUE)");
 
  //create manager (in order to manage users)
  db.get("SELECT * FROM users WHERE userId = ? ",  [ super_user_id ],  function(err, user){
      var saltseed = bcrypt.genSaltSync(8);
      if(!user) {
         db.run("INSERT INTO users(userId, password, auth_token) VALUES ('"+
            super_user_id + "','" +
            bcrypt.hashSync(super_user_pwd, saltseed) + "','" +
            saltseed + "')" );
      } else {
        if( !bcrypt.compareSync(super_user_pwd, user.password)){ //update password
            db.run("UPDATE users SET password= ? WHERE userId= ?",
              [bcrypt.hashSync(super_user_pwd, saltseed), super_user_id],  function(err){
              if(err) {
               console.log(err);
              }
            });
        }
      }
  });

  /*
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS actors ( " +
           "actor TEXT UNIQUE PRIMARY KEY, layout INTEGER not null default 0," +
           "chart_operation INTEGER not null default 0, bookmark INTEGER not null default 0, "+
           "virtual_table INTEGER not null default 0, backend_access INTEGER not null default 0, "+
           "chart_library INTEGER not null default 0 )");

    db.get("SELECT * FROM actors", function(err, actors){
        if( ! actors){
           db.run("INSERT INTO actors ("+
                  "actor,layout, chart_operation,bookmark,virtual_table, backend_access, chart_library) "+ 
                  "VALUES ('Manager',  1,1,1,1,1,1) " );
           db.run("INSERT INTO actors ("+
                  "actor,layout, chart_operation,bookmark,virtual_table, backend_access, chart_library) "+ 
                  "VALUES ('Designer', 1,1,1,0,1,0) " );
           db.run("INSERT INTO actors (" +
                  "actor,layout, chart_operation,bookmark,virtual_table, backend_access, chart_library) "+ 
                  "VALUES ('Operator', 0,0,0,0,1,0) " );
        }
    });
  });
  */

  router.get('/', function(req, res) {
    var auth = req.session.auth;
    var mode = GLOBAL.config.get('Http.client.mode') ;
    switch(mode) {
      case 'prod':
        res.render('index-prod', { csrfToken: req.csrfToken() });
        break;
      case 'test':
        res.render('index-test', { csrfToken: req.csrfToken() });
        break;
      default:
        res.render('index', { csrfToken: req.csrfToken() });
    }
  });

  // GET /api/auth
  // @desc: checks a user's auth status based on cookie
  router.get('/api/auth', function(req, res){
    db.get("SELECT * FROM users WHERE userId = ? AND auth_token = ?", 
           [ req.signedCookies.user_id, req.signedCookies.auth_token ], function(err, user){
      if(user){
        res.json({ user: _.omit(user, ['password', 'auth_token']) });
      } else {
        res.json({ error: "Client has no valid login cookies."  });
      }
    });
  });

  // POST /api/auth/login
  // @desc: login a user
  router.post('/api/auth/login', function(req, res){
    db.get("SELECT * FROM users WHERE userId = ?", [ req.body.userId ], function(err, user){
      if(user) {
        // Compare the POSTed password with the encrypted db password
        if( bcrypt.compareSync( req.body.password, user.password)) { //send back authenticated cookie values
            res.cookie( 'user_id',
                        user.userId,
                        { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge') } //options
                      );
            res.cookie( 'auth_token',
                        user.auth_token,
                        { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge')  } //options
                      );
            // Correct credentials, return the user object
            res.json({ user: _.omit(user, ['password', 'auth_token']) });
        } else {
            // Username did not match password given
            //res.json({ error: "Invalid username or password."  });
            res.status(500).send( {error: "Invalid username or password."});
        }
      } else {
        // Could not find the username
        //res.json({ error: "Username does not exist."  });
        res.status(500).send( {error: "Username does not exist."});
      }
    });
  });

  // POST /api/auth/signup
  // @desc: add/create a new user
  router.post('/api/auth/signup', function(req, res){
    db.serialize(function() {
      
      db.get("SELECT * FROM users WHERE userId = ? AND auth_token = ?", 
           [ req.signedCookies.user_id, req.signedCookies.auth_token ], function(err, user) {
        if(user && user.userId=='admin') {     
          var saltseed = bcrypt.genSaltSync(8);
          db.run("INSERT INTO users(userId, password, auth_token) VALUES (?, ?, ?)", //auth_token is saltseed for the user
          [ req.body.userId, bcrypt.hashSync(req.body.password, saltseed), saltseed ], function(err, rows){
            if(err) {
            res.status(500).send({ error: "User ID has been taken:"+ req.body.userId });
            } else {
              // Retrieve the inserted user data
              db.get("SELECT * FROM users WHERE userId = ?", [ req.body.userId ], 
                function(err, user){
                  if(!user) {
                    console.log(err, rows);
                    res.status(500).send({ error: "Error while trying to add user:" + req.body.userId }); 
                  } else {
                    res.json({ success: "User is successfully added." });
                  }
                });
            }
          });
        } else {
          res.status(500).send({ error: "Havn't enough access authoritation to add user:" + req.body.userId }); 
        }
     }); //db.get end
    });
  });


  // POST /api/auth/signup
  // @desc: add/create a new user
  router.post('/api/auth/update', function(req, res){
    db.serialize(function() {
    
      db.get("SELECT * FROM users WHERE userId = ? AND auth_token = ?", 
           [ req.signedCookies.user_id, req.signedCookies.auth_token ], function(err, user) {
        if(user) {
          db.run("UPDATE users SET password=? WHERE userId=?", //auth_token is saltseed for the user
          [ bcrypt.hashSync(req.body.password, req.signedCookies.auth_token), req.signedCookies.user_id ], function(err, rows){
            if(err) {
              res.status(500).send({ error: "update password  failed for user:"+ req.signedCookies.user_id });
            } else {
              res.json({ success: "Password is successfully updated." }); 
            }
          });
        } else {
          res.status(500).send({ error: "Havn't found the current signed user:" + req.signedCookies.user_id }); 
        }
     }); //db.get end
    });
  });


  // POST /api/auth/logout
  // @desc: logs out a user, clearing the signed cookies
  router.post("/api/auth/logout", function(req, res) {
   
   db.get("SELECT * FROM users WHERE userId = ? AND auth_token = ?", 
           [ req.signedCookies.user_id, req.signedCookies.auth_token ], function(err, user) {
        if(user) {     
          res.clearCookie('user_id');
          res.clearCookie('auth_token');
          res.json({ success: "User successfully logged out." });
        } else {
          res.json({ success: "No need to logout again." });
        }
    });
  });

  // POST /api/auth/remove_account
  // @desc: deletes a user
  router.post("/api/auth/remove", function(req, res) {
    db.serialize(function() {
     db.get("SELECT * FROM users WHERE userId = ? AND auth_token = ?", 
           [ req.signedCookies.user_id, req.signedCookies.auth_token ], function(err, user) {
        if(user && user.userId=='admin') {
          db.run("DELETE FROM users WHERE userId = ?", [ req.body.userId ],
            function(err, rows){
              if(err){ 
                res.status(500).json({ error: "Error while trying to delete user." }); 
              } else {
                res.json({ success: "User is successfully deleted." });
              }
            });
        } else {
           res.status(500).send({ error: "Havn't enough access authoritation to delete user:" + req.body.userId }); 
        }
      });
    });
  });//serialize end

};
