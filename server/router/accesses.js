module.exports.accesses = function (router,db) {
  var  _ = require("underscore");
  // Create our users table if it doesn't exist
  db.run("CREATE TABLE IF NOT EXISTS access ( " +
         "toolId TEXT NOT NULL, userId TEXT NOT NULL DEFAULT '*', authority INTEGER NOT NULL DEFAULT 0)");
 
  // if the tool is created by req.signedCookies.userId, it will have highest authority
  // else check the access table to setup the access authority  
  function setAccess(req, res) {
    db.all("SELECT * FROM tool WHERE user = ? AND id =?",
      req.signedCookies.user_id, req.body.toolId,
      function(err, rows) {
        if (err) {
          setAssignedAccess(req, res);
        } else {
          res.cookie( 'tool_id',
                     access.toolId,
                     { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge') } //options
                  );
          res.cookie( 'authority',
                    1, // read&write access
                    { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge')  } //options
                   );
          res.json({});
        }
    });
  }

  function setAssignedAccess(req, res) {
    db.get("SELECT toolId, authority FROM access WHERE (userId=? OR userId='*') AND toolId= ? ORDER BY authority DESC",
      [ req.signedCookies.user_id, req.body.toolId ], function(err, rows) {
      if(row) {
        //var access = rows[0];
        res.cookie( 'tool_id',
                     row.toolId,
                     { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge') } //options
                  );
        res.cookie( 'authority',
                    access.authority,
                    { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge')  } //options
                   );
        res.json({});
      } else {
            res.status(500).send( {error: "Have not valid access authority for tool:" + req.body.toolId  });
      }
    });
  }

  //firstly, make sure the req.body.toolId is created by req.signedCookies.user_id
  //if yes then insert the access authority for the toolId and specified req.body.userId,
  function addAccess(req, res) {
    db.get("SELECT * FROM tool WHERE user = ? AND id =?",
      req.signedCookies.user_id, req.body.toolId,
      function(err, row) {
        if (err) {
          res.status(500).send({ error: "Havn't enough authority to add access authority for tool: " + req.body.toolId });
        } else {
          
          db.run("INSERT INTO access(toolId, userId, authority) VALUES (?, ?, ?)",
          [ req.body.toolId, req.body.userId, req.body.authority ], function(err){
            if(err) {
              res.status(500).send({ error: "Faild to add access authority for tool: " + req.body.toolId });
            } else {
              res.json({ success: "User is successfully added." });
            }
          });
      }
    });
  }

  //firstly, make sure the req.body.toolId is created by req.signedCookies.user_id
  //if yes then insert the access authority for the toolId and specified req.body.userId
  function updateAccess(req, res) {
     db.get("SELECT * FROM tool WHERE user = ? AND id =?",
      req.signedCookies.user_id, req.body.toolId,
      function(err, row) {
        if (err) {
          res.status(500).send({ error: "Havn't enough authority to update access authority for tool: " + req.body.toolId });
        } else {
          db.run("UPDATE access SET authority=? WHERE userId=? AND toolId=?", //auth_token is saltseed for the user
            [ req.body.authority, req.body.userId, req.body.toolId ], function(err){
              if(err) {
                res.status(500).send({ error: "update access failed for tool:"+ req.body.toolId });
              } else {
                res.json({ success: "access authority is successfully updated." }); 
              }
          });      
      }
    });
  }

  //firstly, make sure the req.body.toolId is created by req.signedCookies.user_id
  //if yes then delete the access authority for the toolId and specified req.body.userId
  function deleteAccess(req, res) {
     db.all("SELECT * FROM tool WHERE user = ? AND id =?",  req.signedCookies.user_id, req.body.toolId,
      function(err, self_created_tool) {
        if (err) {
          res.status(500).send({ error: "Falied to delete access authority for tool: " + req.body.toolId });
        } else {
          if(self_created_tool) {
            db.run("DELETE FROM access WHERE userId = ? and toolId=?", [ req.body.userId, req.body.toolId ],
            function(err){
              if(err) {
                res.status(500).json({ error: "Error while trying to delete access authority." }); 
              } else {
                res.json({ success: "access authority is successfully deleted." });
              }
          });
        } else {
          res.status(500).send({ error: "Can't delete access authority for tool: " + req.body.toolId });
        }  
      }
    });
  }

  function getToolNames(req, res) {
    if(req.body.userId ) {
      db.all("SELECT toolId FROM access WHERE userId = $user", 
             { $user: req.body.userId}, function(err, rows) {
          if (err) {
            console.error(err);
            res.status(500).send({error: err.message});
          } else {
            var tools = _.map(rows, function(row) {return row.toolId;});
            res.send({tools: tools});
          }
        });
    } else {
      var emsg = "incorrect query params( user="+req.body.userId +')';
      //errHandle(emsg);
      console.error(emsg);
      res.status(500).send({error: emsg});
    }
  }

  // GET /api/access
  // @desc: checks a access status based on session
  //in: userId, toolId 
  //out: access --> session
  router.get('/api/access/check', function(req, res) {
    db.get("SELECT authority FROM access WHERE (userId=? OR userId='*') AND toolId= ? ORDER BY authority DESC", 
           [ req.signedCookies.user_id, req.signedCookies.tool_id,  req.signedCookies.authority ], function(err, rows){
      if(rows ) {
        res.json();
      } else {
        res.status(500).json({ error: "Client has no valid access cookies."  });
      }
    });
  });

  // POST /api/auth/login
  // @desc: set the current tool access authority with its access authority
  router.post('/api/access/set', function(req, res){
    setAccess(req, res);
  });

  // POST /api/auth/signup
  // @desc: add/create access authority
  router.post('/api/access/add', function(req, res) {
          if(req.body.userId && req.body.toolId && req.body.authority) {
            db.get("SELECT userId, authority FROM access WHERE userId = ?  AND toolId = ? ORDER BY authority DESC", 
                [ req.body.userId, req.body.toolId], function(err, row) {
              if(row) {
                updateAccess(req, res);
              } else {
                addAccess(req,res); 
              }
            }); //db.get end
          } else {
             res.status(500).send({ error: "Not enough parameters to add access authority." });
          }
});


  // POST /api/auth/update
  // @desc: update an access authority
  router.post('/api/access/update', function(req, res) {
    updateAccess(req, res);
  });

  // POST /api/auth/logout
  // @desc: user, clearing the signed cookies for access authority, used to unselect tool in GUI
  router.post("/api/access/clear", function(req, res) {
   db.get("SELECT * FROM access WHERE userId = ? AND toolId = ?", 
           [ req.signedCookies.user_id, req.signedCookies.tool_id ], function(err, user) {
        if(user) {
          res.clearCookie('tool_id');
          res.clearCookie('authority');
          res.json({ success: "User successfully cleared access authority." });
        } else {
          res.json({ success: "No need to clear access authority again." });
        }
    });
  });

  // POST /api/auth/remove
  // @desc: deletes a access authority from access table
  router.post("/api/access/remove", function(req, res) {
     deleteAccess(req, res);
  });
  
  // POST /api/auth/remove
  // @desc: deletes a access authority from access table
  router.post("/api/access/tools", function(req, res) {
     getToolNames(req, res);
  });
};