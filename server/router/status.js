module.exports.status= function(app, db) {
  
   db.run("CREATE TABLE IF NOT EXISTS status (" +
         "data TEXT(100) default '{}', "+
         "tool TEXT(100) default '{}', "+
         "user TEXT(20) not null )"
        );
  
  var url = '/api/status';
  var modelName = "### STATUS";
  var commonModule = require('../util/common.js'),
      errHandle=commonModule.errHandle,
      logHandle=commonModule.logHandle;
  
  var getStatus = function(req, res) {
    db.get("SELECT * FROM status WHERE user= $user",
           {$user: req.query.user}, function(err, row) {
        if (err) {
          errHandle(err);
          res.status(500).send( {error: err.message});
        } else {
          if(row){
            res.send(row);
          } else {
            res.send();
          }
        }
      });
  };
  
  var updateStatus = function(req, res) {
    var  model = req.body,
         stmt_update = "UPDATE status SET data=$data, tool=$tool WHERE user=$user";
    db.run(stmt_update, 
           {$user: model.user, 
            $tool: JSON.stringify(model.tool), 
            $data: JSON.stringify(model.data) }, 
      function(err) {
        if (err) {
          errHandle(err);
          res.status(500).send( {error: err.message});
        } else {
          res.send();
        }
      });
  };
  
  
  var insertStatus = function(req, res) {
    var  model = req.body, 
         stmt_insert = "INSERT INTO status (user, data, tool) VALUES ($user, $data, $tool)";
    db.run(stmt_insert, {$user: model.user, 
                         $data: JSON.stringify(model.data), 
                         $tool: JSON.stringify(model.tool) }, 
      function(err) {
        if (err) {
          errHandle(err);
          res.status(500).send( {error: err.message});
        } else {
           res.send();
        }
      });
  };
  
  var writeStatus = function(req, res) {
    var  stmt_options = {$user: req.body.user},
         stmt_select = "SELECT data, tool FROM status WHERE user= $user";
    db.get(stmt_select, stmt_options, function(err, row) {
        if (err) {
          errHandle(err);
          res.status(500).send( {error: err.message});
        } else {
          if(row){
            updateStatus(req, res);
          } else {
            insertStatus(req, res);
          }
        }
    });
  };
  
  app.get(url, function (req, res) {
    logHandle(modelName+' GET: ' + JSON.stringify(req.query));
    getStatus(req, res);
  });
  app.put(url, function (req, res) {
    logHandle(modelName+' PUT:' + JSON.stringify(req.body));
    writeStatus(req, res);
  });
  app.post(url, function (req, res) {
    logHandle(modelName+' POST:' + JSON.stringify(req.body));
    writeStatus(req, res);
  });
};