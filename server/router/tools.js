module.exports.tools =function(app, db) {
  var  _ = require("underscore"),
      $  = require('jquery-deferred');
  db.run("CREATE TABLE IF NOT EXISTS tool (" +
         "id TEXT(50) UNIQUE PRIMARY KEY, "+ //tool id is editable be an operator
         "user TEXT(20) NOT NULL, "+
         "format TEXT(50) NOT NULL, " +
         "description TEXT(1000), "+
         "imgurl TEXT(100), " +
         "time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "+
         "graph TEXT(2000) NOT NULL DEFAULT '{}' )"
        );
  
  var url = '/api/tool';
  var modelName = "###TOOL ";
  var commonModule = require('../util/common.js'),
      errHandle=commonModule.errHandle,
      logHandle=commonModule.logHandle;
  
  var getToolNames = function(req, res) {
    if(req.body.user ) {
      db.all("SELECT id FROM tool WHERE user= $user", 
             {$user: req.body.user}, function(err, rows) {
          if (err) {
            console.error(err);
            res.status(500).send({error: err.message});
          } else {
            var tools = _.map(rows, function(row) {return row.id;});
            res.send({tools:tools});
          }
        });
    } else {
      var emsg = "incorrect query params( user="+req.body.user +')';
      
      console.error(emsg);
      res.status(500).send({error: emsg});
    }
  };
  
  var getSharedTools = function(req, res) {
    var deferred = $.Deferred();
    if(req.query.user && req.query.format ) {
      var sql_string = "SELECT tool.id, tool.imgurl,tool.format, tool.description, max(authority) as authority FROM access "+
          "JOIN tool ON access.toolId=tool.id  "+
          "WHERE (access.userId=$user1 OR (access.userId='*' AND tool.user<>$user2)) "+
          "AND tool.format=$format GROUP BY toolId ORDER BY access.authority DESC";
      db.all(sql_string, { $user1: req.query.user, $user2: req.query.user, $format: req.query.format}, function(err, rows) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(rows);
          }
        });
    } else {
      var emsg = "incorrect query params: user=" + req.query.user +' ,format=' + req.query.format;

       deferred.reject({error:emsg});
    }
    return deferred.promise();
  };

  var getTools = function(req, res) {
    var deferred = $.Deferred();

    if(req.query.user && req.query.format ) {
      db.all("SELECT id, imgurl, format, description, 'write' as authority FROM tool WHERE user= $user AND format= $format ", 
         { $user: req.query.user, $format: req.query.format }, function(err, rows) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(rows);
          }
        });
    } else {
      var emsg = "incorrect query params: user=" + req.query.user +' ,format=' + req.query.format;
      deferred.reject({error: emsg});
    }
    return deferred.promise();
  };
  
  var sendToolWithAccessAuthority= function(req, res, tool) {
    if(tool.user== req.query.user) {
      //set highest authority
      res.cookie('authority', 'write', 
                  { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge')  } //options
                );
      res.send(tool);
    } else {
      var stmt_select ="SELECT max(authority) as authority FROM access WHERE toolId=$id"; //outer join with access
      db.get(stmt_select, [tool.id], function(err, row) {
        if(err) {
          res.status(500).send({error: err.message});
        } else {
          if (row) {
            //set access authority
            res.cookie('authority', row.authority,
                          { signed: true, maxAge: GLOBAL.config.get('Http.session.cookieMaxAge')  } //options
                      );
            res.send(tool);
          }else {
            res.clearCookie('authority');
            res.send(tool);
          }
        }
      });
    }
  }; 

  //get tool and set/change access authority 
  var getTool = function(req, res) {
    var stmt_options = { $id: req.params.id},
        stmt_select ="SELECT * FROM tool WHERE id=$id "; //outer join with access
    if(req.query.format) {
      stmt_options.$format = req.query.format;
      stmt_select += "AND format= $format ";
    }
    db.get(stmt_select, stmt_options, function(err, row) {
      if (err) {
        errHandle(err);
        res.status(500).send({error: err.message});
      } else {
        if (row) {
          sendToolWithAccessAuthority(req, res, row);
        }else{
          var emsg = "Havn't found tool(id): " + req.params.id;
          errHandle(emsg);
          res.status(500).send({error: emsg});
        }
      }
    });
  };
  
  //add new tool and set the current user as tool creater 
  var insertTool = function (req, res) {
    var model = req.body, 
        stmt_insert = "INSERT INTO tool " +
                "(user, id, description, imgurl, format, graph) "+
                "VALUES ($user, $id , $description, $imgurl, $format, $graph)";
    db.run(
      stmt_insert,
      { $user: model.user,
        $id: model.id,
        $description: model.description,
        $imgurl: model.imgurl,
        $format: model.format,
        $graph: (typeof model.graph === 'object')?  JSON.stringify(model.graph) : model.graph
      }, 
      function(err) {
          if(err){ //insert error
            errHandle(err);
            res.status(500).send({error: err.message});
          } else { //successful
            res.send();
          }
      }//function end
    );//run end
  };
  
  //besides the tool creater, WRITE access user can also update it
  //only update 'graph'?
  var updateTool = function (req, res) {
    if(req.signedCookies.authority=="write") {
      db.run(
        "UPDATE tool SET graph= ? WHERE user= ? AND id= ?",
        [JSON.stringify(req.body.graph), req.body.user, req.body.id],
        function(err){
          if(err) {
            errHandle(err);
            res.status(500).send({error: err.message});
          } else { //successful
            res.send();
          }
      });
    } else {
      var emsg = 'have not enough authority to update existed tool';
      res.status(500).send({error: emsg});
    }
  };
  
  var writeTool = function(req, res) {
    db.get("SELECT * FROM tool WHERE AND id =?", /*req.body.user,*/ req.body.id,
      function(err, row) {
        if (err) {
          errHandle(err);
          res.status(500).send({error: err.message});
        } else {
          if(row){
            updateTool(req, res);
          } else {
            insertTool(req, res);
          }
        }
    });
  };
  
  //only the tool creater can delete it
  var deleteTool = function(req, res) {
    var stmt_delete = "DELETE FROM tool WHERE id=$id AND format=$format AND user=$user";
    db.run(stmt_delete, { $id: req.query.id, $format: req.query.format, $user: req.query.user},
           function(error) {
                if(error){
                  errHandle(error);
                  res.status(500).send({error: error.message});
                }else{
                  res.json({message: 'Successful!' });
                }
             });
    
  };
  
  app.delete(url, function (req, res) {
    logHandle(modelName + 'DELETE(query): '+ JSON.stringify(req.query));
    deleteTool(req, res);
  });
  
  app.get(url, function (req, res) {
    logHandle(modelName + 'GET(list): '+ JSON.stringify(req.query));
    getTools(req, res)
    .done(function(selfTools) {
       getSharedTools(req, res)
       .done(function(sharedTools) {
         res.send(_.union(selfTools, sharedTools));
       })
       .fail(function(err){
         console.error(err);
         res.send(selfTools);
       });
    })
    .fail(function(err){
      res.status(500).send(err);
    });
  });

  app.get(url+'/:id', function (req, res) {
    logHandle(modelName + 'GET: '+ req.params.id + ', query=' + JSON.stringify(req.query));
    getTool(req, res);
  });
  
  //get tool name list 
  app.post(url+'/list', function (req, res) {
    logHandle(modelName + 'POST: ' + JSON.stringify(req.body));
    getToolNames(req, res);
  });

  //save tool with id and description
  app.post(url+'/:id', function (req, res) {
    logHandle(modelName + 'POST: ' + JSON.stringify(req.body));
    writeTool(req, res);
  });
  
  //upate changed part
  app.put(url+'/:id', function (req, res) {
     logHandle(modelName + 'PUT: ' + JSON.stringify(req.body));
     writeTool(req, res);
  });
};
