//save board/board collection properties
module.exports.charts = function (router, db) {
    var modelName = '###chart ';
    var url = '/api/chart';
    var commonModule = require('../util/common.js'),
        errHandle=commonModule.errHandle,
        logHandle=commonModule.logHandle;
    
    db.run("CREATE TABLE IF NOT EXISTS chart ( " +
           "id INTEGER UNIQUE PRIMARY KEY, " +
           "vtname TEXT not null default '', " +
           "vttype TEXT not null default '', " +
           "linkids TEXT default '[]', " +
           "caption TEXT default '', " +
           "colorTheme TEXT default '', " +
           "colorDomainName TEXT default '', " +
           "colorDomain TEXT default '[]', " +
           "colorIndexes TEXT default '{}', " +
           "dataRefiner TEXT default '{}', " +
           "dataSelector TEXT default '[]', " +
           "dataExtraRefiner TEXT default '{}', " +
           "dataExtraSelector TEXT default '[]', " +
           "dataMapper TEXT default '{}', " +
           "ioattrs TEXT not null default '{}' )"
          );
    
    //this function should not be called!
    router.get(url, function (req, res) {
      logHandle(modelName +'GET(error): ' + JSON.stringify(req.query));
      res.send({});
    });
    //this function should not be called!
    router.delete(url, function(req, res) {
      logHandle(modelName +'DELETE(error): ' + JSON.stringify(req.params));
    });

    //this function should not be called!
    router.put(url, function(req, res) {
      logHandle(modelName+'PUT(error): ' + JSON.stringify(req.params));
    });
  
   //create a new model
    router.post(url, function (req, res) {
      var model = req.body;
      logHandle(modelName+'POST: ' + JSON.stringify(req.body));
      //insert to db
      db.get("SELECT MAX(id) as maxid FROM chart", function(err, row){
          if (err) {
            errHandle(err);
            res.status(500).send({error: err.message});
          }else{
              var nextid = 0;
              if(row) nextid = row.maxid +1;
              var stmt_insert = "INSERT OR IGNORE INTO chart " +
                  "(id, vtname, vttype) VALUES ($id, $vtname, $vttype)" ;
              db.run(stmt_insert, {
                       $id: nextid,
                       $vtname: model.vtname,
                       $vttype: model.vttype,
                      } ,
                     function(err){
                        if (err) {
                          errHandle(err);
                          res.status(500).send({error: err.message});
                        }else{
                          res.send({id: nextid});
                        }
                      }
                    );
              //stmt_insert.finalize();
          }
      });
      //res.send({});
    });
    
   //get one model
    router.get(url + '/:id', function (req, res) {
      var emsg;
      logHandle(modelName +'GET(id): ' + JSON.stringify(req.params));
      if(typeof(req.signedCookies.authority) !== "undefined") {
        
        db.get("SELECT * FROM chart WHERE id= ?", [req.params.id], function(err, row){
          if(!err && row) {
            res.send(row);
          } else {
            emsg = "Haven't found chart with id= " +req.params.id;
            errHandle(emsg);
            res.status(500).send({ error: emsg });
          }
        });
      } else {
        emsg = "Haven't access authority for chart with id= " +req.params.id;
        errHandle(emsg);
        res.status(500).send({ error: emsg });
      }
    });
  
    
    router.delete(url + '/:id', function(req, res) {
      logHandle(modelName+'DELETE(id): ' + JSON.stringify(req.params.id));
      if(req.signedCookies.authority=='write') {
        var stmt_delete = "DELETE FROM chart WHERE id=?";
        db.run(stmt_delete, [ +req.params.id],
              function(error) {
                  if(error){
                    errHandle(error);
                    res.status(500).send({error: error.message});
                  }else{
                    res.json({message: 'Successful!' });
                  }
              });
      } else {
        var emsg = "Haven't enought access authority to delete chart with id= " +req.params.id;
        errHandle(emsg);
        res.status(500).send({ error: emsg });
      }
    });
  
    router.post(url + '/:id', function(req, res){
      logHandle(modelName+'POST(id): ' + req.params.id);
      write_callback(req, res);
    });//post end
    router.put(url + '/:id', function(req,res){
      logHandle(modelName+'PUT(id): ' + req.params.id);
      write_callback(req, res);
    });//put end
    router.patch(url + '/:id', function(req,res){
      logHandle(modelName+'PATCH(id): ' + req.params.id);
      write_callback(req, res);
    });//put end
  
    function execUpate(req, res) {
       var andpart = "", valarrs =[],
           model = req.body;
       for(var key in model){
          if (model.hasOwnProperty(key) && key!== 'id') {
             var value = model[key];
             if(typeof value == 'object') value = JSON.stringify(value);
             valarrs.push(value);
             andpart += (andpart.length>0)? ' , '+key+ '=?' : key+'=?';
          }
        }
        var stmt_update = "UPDATE chart SET "+ andpart+ " where id=?";
        valarrs.push( +req.params.id );
        db.run(stmt_update, valarrs,
           function(err) {
             if(err) {
               errHandle(err);
                 res.status(500).send({error: err.message});
              } else {
                res.send({});
              }
            }
        );
    }

    function write_callback(req, res) {
      var emsg;
      if(req.signedCookies.authority=="write") {
        db.serialize(function () {
          db.get("SELECT * FROM chart WHERE id= $id", {$id: +req.params.id},
          function(err, row){
            if (err) {
              errHandle(err);
              res.status(500).send({error: err.message});
            }else{
              if(row) {
              execUpate(req, res);
              } else {
                emsg = "Havn't find chart with id= "+ req.params.id;
                errHandle(emsg);
                res.status(500).send({error: emsg});
              }
            }
          });
        });
      } else {
        emsg = "Havn't enough access authority to update chart with id= "+ req.params.id;
        errHandle(emsg);
        res.status(500).send({error: emsg});
      }
    }//callback end

};
