module.exports.tools =function(app, db) {
  
  db.run("CREATE TABLE IF NOT EXISTS tool (" +
         "id TEXT(50) not null, "+ //tool id is editable be an operator
         "user TEXT(20) not null, "+
         "format TEXT(50) not null, " +
         "description TEXT(1000), "+
         "imgurl TEXT(100), " +
         "time DATETIME not null default CURRENT_TIMESTAMP, "+
         "graph TEXT(2000) not null default '{}' )"
        );
  
  var url = '/api/tool';
  var modelName = "###TOOL ";
  var commonModule = require('../util/common.js'),
      errHandle=commonModule.errHandle,
      logHandle=commonModule.logHandle;
  
  var getTools = function(req, res) {
    if(req.query.user && req.query.format ) {
      db.all("SELECT * FROM tool WHERE user= $user AND format= $format ", 
             {$user: req.query.user, $format: req.query.format }, function(err, rows) {
          if (err) {
            errHandle(err);
            res.status(500).send({error: err.message});
          } else {
            res.send(rows);
          }
        });
    } else {
      var emsg = "incorrect query params: user="+req.query.user +' ,format=' + req.query.format;
      errHandle(emsg);
      res.status(500).send({error: emsg});
    }
  };
  
  
  var getTool = function(req, res) {
    var stmt_options = {$user: req.query.user, $id: req.params.id},
        stmt_select ="SELECT * FROM tool WHERE user=$user AND id=$id ";
    if(req.query.format) {
      stmt_options.$format = req.query.format;
      stmt_select += "AND format= $format ";
    }
    db.all(stmt_select, stmt_options, function(err, rows) {
      if (err) {
        errHandle(err);
        res.status(500).send({error: err.message});
      } else {
        if (rows.length) {
          res.send(rows[0]);
        }else{
          var emsg = "Havn't find tool(id): " + req.params.id;
          errHandle(emsg);
          res.status(500).send({error: emsg});
        }
      }
    });
  };

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
        $graph: (typeof model.graph === 'object')? 
                JSON.stringify(model.graph) : model.graph
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
  
  //only update 'graph'?
  var updateTool = function (req, res) {
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
  };
  
  var writeTool = function(req, res) {
    //check the user to have enough authorization?
    db.all("SELECT * FROM tool WHERE user = ? AND id =?",
      req.body.user, req.body.id,
      function(err, rows) {
        if (err) {
          errHandle(err);
          res.status(500).send({error: err.message});
        } else {
          if(rows.length){
            updateTool(req, res);
          } else {
            insertTool(req, res);
          }
        }
    });
  };
  
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
    getTools(req, res);
  });

  app.get(url+'/:id', function (req, res) {
    logHandle(modelName + 'GET: '+ req.params.id + ', query=' + JSON.stringify(req.query));
    getTool(req, res);
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
