module.exports.authentication = function (router,db){
  var bcrypt        = require("bcrypt-nodejs"),
    _ = require("underscore");
  var super_user_id  = GLOBAL.config.get('FrontEnd.superuser.userId'),
      super_user_pwd = GLOBAL.config.get('FrontEnd.superuser.password');
  // Create our users table if it doesn't exist
  db.run("CREATE TABLE IF NOT EXISTS users ( " +
         " userId TEXT UNIQUE PRIMARY KEY, actor TEXT NOT NULL, password TEXT, auth_token TEXT UNIQUE)");
 
  db.get("SELECT * FROM users WHERE userId = ? ",  [ super_user_id ],  function(err, user){
      var salt = bcrypt.genSaltSync(8);
      if( ! user){
         db.run("INSERT INTO users(userId, actor, password, auth_token) VALUES ('"+
            super_user_id + "','Manager','" +
            bcrypt.hashSync(super_user_pwd, salt) + "','" +
            salt + "')" );
      } else {
        if( !bcrypt.compareSync( super_user_pwd, user.password)){ //update password
            db.run("UPDATE users SET password= ? WHERE userId= ?",
              [bcrypt.hashSync(super_user_pwd, salt), super_user_id],  function(err){
              if(err) {
               console.log(err);
              }
            });
        }
      }
  });
  
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
      if(user){
        // Compare the POSTed password with the encrypted db password
        if( bcrypt.compareSync( req.body.password, user.password)){
            res.cookie('user_id',
                       user.userId,
                       { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge')  });
            res.cookie('auth_token',
                       user.auth_token,
                       { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge')  });

            // Correct credentials, return the user object
            res.json({ user: _.omit(user, ['password', 'auth_token']) });
        } else {
            // Username did not match password given
            res.json({ error: "Invalid username or password."  });
        }
      } else {
        // Could not find the username
        res.json({ error: "Username does not exist."  });
      }
    });
  });

  // POST /api/auth/signup
  // @desc: creates a user
  router.post('/api/auth/signup', function(req, res){
    db.serialize(function(){
      var salt = bcrypt.genSaltSync(8);
      db.run("INSERT INTO users(userId, actor, password, auth_token) VALUES (?, ?, ?, ?)", 
      [ req.body.userId, req.body.actor, bcrypt.hashSync(req.body.password, salt),
       salt ],function(err, rows){
        if(err){
          res.json({ error: "User ID has been taken.", field: "userId" });
        } else {
          // Retrieve the inserted user data
          db.get("SELECT * FROM users WHERE userId = ?", [ req.body.userId ], 
            function(err, user){
              if(!user) {
                console.log(err, rows);
                res.json({ error: "Error while trying to register user." }); 
              } else {
                db.get("SELECT * FROM authorization WHERE actor = ?", [ req.body.actor ], 
                  function(err, actors){
                    if(err){
                       console.log(err);
                       res.json({ error: "Error while trying to find actor's authorization." }); 
                    } else {
                      var authorization = { layout: 0x00, chart_operation: 0x00,
                                            bookmark: 0x00, virtual_table: 0x00,
                                            backend_access: 0x00, chart_library: 0x00};
                      if(actors.length>0){
                        authorization.layout = actors[0].layout;
                        authorization.chart_operation = actors[0].layout;
                        authorization.bookmark = actors[0].bookmark;
                        authorization.virtual_table = actors[0].virtual_table;
                        authorization.backend_access = actors[0].backend_access;
                        authorization.chart_library = actors[0].chart_library;
                      }
                      // Set the user cookies and return the cleansed user data
                      res.json({ user: _.omit(user, ['password', 'auth_token']),
                                 authorization: authorization });
                    }
                });
              }
            });
        }
      });
    });
  });


  // POST /api/auth/logout
  // @desc: logs out a user, clearing the signed cookies
  router.post("/api/auth/logout", function(req, res){
   res.clearCookie('user_id');
   res.clearCookie('auth_token');
   res.json({ success: "User successfully logged out." });
  });

  // POST /api/auth/remove_account
  // @desc: deletes a user
  router.post("/api/auth/remove_account", function(req, res){
    db.run("DELETE FROM users WHERE userId = ? AND auth_token = ?", 
      [ req.signedCookies.user_id, req.signedCookies.auth_token ], 
      function(err, rows){
        if(err){ 
          res.json({ error: "Error while trying to delete user." }); 
        } else {
          res.clearCookie('user_id');
          res.clearCookie('auth_token');
          res.json({ success: "User successfully deleted." });
        }
      });
  });
 };
