//save/get screen data-- the screen could be current screen, or a bookmarked screen
module.exports.screen = function(app, db) {
  var modelName = '###SCREEN ';
  var url = '/api/screen';
  var uuid = require('node-uuid');
  
  var commonModule = require('../util/common.js'),
      errHandle=commonModule.errHandle,
      logHandle=commonModule.logHandle;
  
  //screen 
  db.run("CREATE TABLE IF NOT EXISTS screen (" +
         "id TEXT(50) NOT NULL PRIMARY KEY, "+ 
         "user TEXT NOT NULL, "+ 
         "format TEXT(50), " + // is format necessary ? 2016/7/11
         "description TEXT DEFAULT '', "+ //screen description
         "imgurl TEXT DEFAULT '', " + //snpshot path
         "maxRows INTEGER NOT NULL DEFAULT 5, " +
         "maxColumns INTEGER NOT NULL DEFAULT 2, "+
         "margin INTEGER NOT NULL DEFAULT 5, " +
         "cells TEXT(1000) NOT NULL DEFAULT '{}', "+
         "time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP )" //last update time
        );
  
  //get screen list of screes creater
  var getScreens = function(req, res) {
    var  stmt_options = {$user: req.query.user},
         stmt_select = db.prepare(
           "SELECT id, description, imgurl FROM screen WHERE user= $user");
    stmt_select.all(stmt_options, function(err, rows) {
        if (err) {
          errHandle(err);
           res.status(500).send({error: err.message});
        } else {
           res.send({data: rows});
        }
      });
  };
  
  //the screen id may come from shared tools
  var getScreenWithId = function(req, res) {
    var emsg='', 
        select_sql= "SELECT * FROM screen WHERE id=$id";
    db.get(select_sql, {$id: req.params.id},
      function(err, row) {
          if (err) {
            res.status(500).send( {error: err.message});
          } else {
            if (row) {
              if(row.user == req.query.user ) {
                //res.clearCookie('tool_id');
                res.clearCookie('authority');
                res.send(row);
              } else if( typeof(req.signedCookies.authority) !='undefined') {
                res.send(row);
              } else {
                emsg = "Has not enough authrity to access tool "+ req.params.id;
                res.status(500).send( {error: emsg});
              }
            }else{
              emsg = "Haven't found model with id: "+ req.params.id;
              res.status(500).send( {error: emsg});
            }
          }
        } 
      );
  };
  
  //only the owner can show her/his last screen
  var getLastScreenWithoutId = function(req, res) {
    var select_sql= "SELECT user, id, description, imgurl, maxRows, margin, "+
                  "maxColumns, cells, MAX(time) as time FROM screen WHERE user= $user";
    db.get(select_sql, { $user: req.query.user},
      function(err, row) {
        try{
          if (err) {
            throw err;
          } else {
            if (row) {
              res.send(row);
            }else{
              res.send();
            }
          }
        } catch(e) {
          errHandle(e);
          res.status(500).send( {error: e.message});
        }
      });
  };

  //screens from shared tools (different users) can be also copied
  var execCloneScreenWithId = function(req, res) {
    var model = req.body;
    db.get("SELECT * FROM screen WHERE id =$id", {$id: model.id},
        function(err, row) {
          if (err) {
            errHandle(err);
            res.status(500).send({error: err.message});
          } else {
            if (row) {//id existed
              var stmt_insert = "INSERT INTO screen " +
                  "(user, margin, maxColumns, maxRows, cells, id, description, imgurl) "+
                  "VALUES ($user, $margin, $maxColumns, $maxRows, $cells, $id , $description, $imgurl)";
              db.run(stmt_insert,
              {
                $user: model.user,
                $id: model.cloneid,
                $description: model.description,
                $imgurl: model.imgurl,
                $margin: row.margin,
                $maxColumns: row.maxColumns,
                $maxRows: row.maxRows,
                $cells: (typeof row.cells == 'object')?
                    JSON.stringify(row.cells): row.cells
              }, function(err) {
                if(err){ //insert error
                  errHandle(err);
                  res.status(500).send( {error: err.message});
                } else { //successful
                  res.send({id: model.cloneid});
                }
              });
            } else {//not unique, update ?
              var emsg = "No cloneable screen ID: " + id;
              errHandle(emsg);
              res.status(500).send( {error: emsg});
            }
          }
        });
  };
  
  var cloneScreenWithId = function (req, res) {
    logHandle(req.body);
    //check cloneid not existed
    var model = req.body;
    //check  whether or not user have owned screen id , if not copy it
    db.all("SELECT * FROM screen WHERE user = $user AND id =$id",
        {$user: model.user, $id: model.cloneid},
        function(err, rows) {
          if (err) {
            errHandle(err);
              res.status(500).send({error: err.message});
          } else {
            if (!rows.length) {//id not existed, OK to be copied
              execCloneScreenWithId(req, res);
            } else { //existed id, warning user to change it
              var emsg = "Existed screen clone ID: " + model.cloneid;
              errHandle(emsg);
              res.status(500).send( {error: emsg});
            }
          }
        }); //db calling end
  };
  
  //now have not used?
  var createNewScreenWithoutId = function (req, res) {
    logHandle(req.body);
    var id = uuid(), model = req.body;
    db.all("SELECT * FROM screen WHERE user = $user AND id =$id",
        {$user: model.user, $id: id},
        function(err, rows) {
          if (err) {
            errHandle(err);
              res.status(500).send({error: err.message});
          } else {
            if (!rows.length) {
              var stmt_insert = "INSERT INTO screen " +
                  "(user, margin, maxColumns, maxRows, cells, id, description, imgurl) "+
                  "VALUES ($user, $margin, $maxColumns, $maxRows, $cells, $id , $description, $imgurl)";
              db.run(stmt_insert,
              {
                $user: model.user ,
                $id: id ,
                $margin: model.margin ,
                $maxColumns: model.maxColumns ,
                $maxRows: model.maxRows ,
                $cells: (typeof model.cells == 'object')?
                    JSON.stringify(model.cells): model.cells ,
                $description: model.description ,
                $imgurl: model.imgurl
              }, function(err) {
                if(err){ //insert error
                  errHandle(err);
                   res.status(500).send( {error: err.message});
                } else { //successful
                  res.send({id: id});
                }
              });
            } else {//not unique, update ?
              var emsg = "Existed screen ID: " + id;
              errHandle(emsg);
              res.status(500).send( {error: emsg});
            }
          }
        });
  };
  
  var execCreateScreenWithId = function(req, res) {
    var model = req.body;
    var stmt_insert = "INSERT INTO screen " +
                  "(user, id, description, margin, maxColumns, maxRows) "+
                  "VALUES ($user, $id , $description, $margin, $maxColumns, $maxRows)";
    db.run(stmt_insert,
     {
       $user: model.user,
       $id: model.id,
       $description: model.description,
       $margin: model.margin,
       $maxColumns: model.maxColumns,
       $maxRows: model.maxRows
     }, function(err) {
       if(err){ //insert error
        errHandle(err);
        res.status(500).send( {error: err.message});
       } else { //successful
         res.send({id: model.id});
       }
     });
  };

  var createScreenWithId = function (req, res) {
    logHandle(req.body);
    var emsg, model = req.body;
    db.get("SELECT * FROM screen WHERE id =$id", {/*$user:model.user,*/ $id: model.id},
      function(err, row) {
        if (err) {
          errHandle(err);
          res.status(500).send({error: err.message});
        } else {
          if (row) {
            emsg = "Existed screen ID: " + model.id;
            errHandle(emsg);
            res.status(500).send( {error: emsg});
          } else {
            execCreateScreenWithId(req, res);
          }
        }
      });
  };

  var execUpdateScreenWithId = function(req, res, screen) {
    var model = req.body, id = req.params.id;
    var andpart = "", valarrs =[];
    if(screen.user== req.signedCookies.user_id || req.signedCookies.authority=='write') {

      for(var key in model) {
        if (model.hasOwnProperty(key) ) {
          andpart += (andpart.length>0)? ' , '+key+ '=?' : key+'=?';
          var value = model[key];
          if(typeof value == 'object') value = JSON.stringify(value);
          valarrs.push(value);
        }
      }
      andpart+= ", time=CURRENT_TIMESTAMP";
      var stmt_update = "UPDATE screen SET "+ andpart+ " where id=? and user=?";
      valarrs.push(id);
      valarrs.push(model.user);
      db.run(stmt_update, valarrs, function(err) {
        if(err){ //insert error
          errHandle(err);
          res.status(500).send( {error: err.message});
        } else { //successful
          res.send({id: model.id});
        }
      });
    }  else {
      emsg = "Havn't enough access authority to update screen :"+ id;
      errHandle(emsg);
      //res.status(500).send( {error: emsg});
      res.send({});
    }
  };

  //for PUT/POST(PATCH) '/api/screen/:id'
  var updateScreenWithId = function (req, res) {
    var emsg,  model = req.body, id = req.params.id;//keep the old id
    logHandle(req.body);
    if(req.params.newid) { 
      model.id = req.params.newid; 
    }

    db.get("SELECT * FROM screen WHERE id = $id", {$id: id},function(err, row) {
            if (err) {
              errHandle(err);
              res.status(500).send( {error: err.message});
            } else {
              if (row) {//update
                execUpdateScreenWithId(req, res, row);
              } else {
                emsg = "Havn't found the screen ID :"+ id;
                errHandle(emsg);
                res.status(500).send( {error: emsg});
              }
            }
    });

  };
    
  var insertScreenWithoutId = function (req, res) { //for POST '/api/screen'
    logHandle(req.body);
    var id = uuid(), model = req.body;
    db.get("SELECT * FROM screen id =$id", { $id: id},
        function(err, row) {
          if (err) {
            errHandle(err);
            res.status(500).send({error: err.message});
          } else {
            if (row) {
              var emsg = "Existed screen ID: " + id;
              errHandle(emsg);
              res.status(500).send( {error: emsg});
            } else {
              var stmt_insert = "INSERT INTO screen " +
                  "(user, margin, maxColumns, maxRows, cells, id, description, imgurl) "+
                  "VALUES ($user, $margin, $maxColumns, $maxRows, $cells, $id , $description, $imgurl)";
              db.run(stmt_insert,
              {
                $user: model.user,
                $id: id,
                $margin: model.margin,
                $maxColumns: model.maxColumns,
                $maxRows: model.maxRows,
                $cells: JSON.stringify(model.cells),
                $description: model.description,
                $imgurl: model.imgurl
              }, function(err) {
                if(err){ //insert error
                  errHandle(err);
                  res.status(500).send( {error: err.message});
                } else { //successful
                  res.send({id: id});
                }
              });
            } 
          }
        });
    };
  
   //only the screen owner can delete it
   var deleteScreen = function (req, res) {
     var stmt_delete = "DELETE FROM screen WHERE id=$id AND user=$user";
     db.run(stmt_delete, { $id: req.query.id, /*$format: req.query.format,*/ $user: req.query.user},
      function(error) {
        if(error){
          errHandle(error);
          res.status(500).send({error: error.message});
        }else{
          res.json({message: 'Successful!' });
        }
     });
  };
  
  //get screen with lastest or create new screen
  app.get(url, function (req, res) {
    logHandle(modelName+' GET: ' + JSON.stringify(req.query));
    getLastScreenWithoutId(req, res);
  });
  
  //delete screen
  app.delete(url, function(req, res) {
    logHandle(modelName+' DELETE: '+ JSON.stringify(req.query));
    deleteScreen(req,res);
  });

  //save screen(without id)
  app.put(url, function (req, res) {
    logHandle(modelName+' PUT: ' + JSON.stringify(req.query));
    insertScreenWithoutId(req,res);
  });
  app.post(url, function (req, res) {
    logHandle(modelName+' POST: ' + JSON.stringify(req.query));
    insertScreenWithoutId(req,res);
  });
  //save Screen with id
  app.post(url + '/:id', function (req, res) {
    logHandle(modelName+' POST(id): ' + req.params.id);
    updateScreenWithId(req, res);
  });
  app.put(url+'/:id', function (req, res) { //update
    logHandle(modelName+' PUT(id): ' + req.params.id);
    updateScreenWithId(req, res);
  });
  app.patch(url + '/:id', function(req,res){
      logHandle(modelName+'PATCH(id): ' + req.params.id);
     updateScreenWithId(req, res);
  });//put end
  
  //get Screen with id
  app.get(url + '/:id', function (req, res) {
    logHandle(modelName+ 'GET(id): ' + req.params.id );
    getScreenWithId(req, res);
  });
  //delete scree with id
  app.delete(url+'/:id', function(req, res) {
    logHandle(modelName+' DELETE(id): ' + req.params.id);
    deleteScreen(req, res);
  });
  
  app.post(url+'_clone', function(req, res) {
    logHandle(modelName+' CLONE(id): ' + JSON.stringify(req.body));
    cloneScreenWithId(req, res);
  });
  
  //get list
  app.get(url+'_list', function(req, res) {
    logHandle(modelName+' GET(list): ' + req.params.id);
    getScreens(req, res);
  });
  
  //get list
  app.get(url+'_lastest', function(req, res) {
    logHandle(modelName+' GET(_lastest): ' + req.query.user);
    getLastScreenWithoutId(req, res);
  });
  
  //POST list
  app.post(url+'_new', function(req, res) {
    logHandle(modelName+' POST(_new): ' + req.params.id);
    createScreenWithId(req, res);
  });
  
  //POST list
  app.post(url+'_new/:id', function(req, res) {
    logHandle(modelName+' POST(_new with id): ' + req.params.id);
    createScreenWithId(req, res);
  });
};
