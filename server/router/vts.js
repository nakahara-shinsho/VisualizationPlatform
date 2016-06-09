module.exports.vts = function (router, db) {
  
  var filesystem = require("fs");
  
  //get all virtual tables
  router.get('/api/vts', function (req, res) {
    var vtListObj = GLOBAL.mqFrontend.vts;
    if(req.query.kind){
      var list = [];
      switch (req.query.kind){
        case 'TABLE':
          list = vtListObj.TABLE;
          break;
        case 'TREE':
          list = vtListObj.TREE;
          break;
        case 'STREAM':
          list = vtListObj.STREAM;
          break;
        default:
          if(vtListObj.ADVANCED[req.query.kind]){
              list = vtListObj.ADVANCED[req.query.kind];
          } 
          break;
      }
      res.send(list);
    }else{
        res.send(vtListObj);
    }
  });
  
  router.get('/api/vts/modules', function(req, res) {
    
    var modules = {};
    
    var _getAllFilesFromFolder = function(dir) {
      var results =[];
      filesystem.readdirSync(dir).forEach(function(filename) {
        var file = dir+'/'+filename;
        var stat = filesystem.statSync(file);
        if (stat && stat.isDirectory()) {
          if(filename !== 'TABLE' && filename !== 'TREE' && filename !== 'STREAM') {
            results.push(filename); 
          }
        }
      });
      return results;
    };
    
    //modules['advanced'] =_getAllFilesFromFolder(__dirname + "visualization");
    modules.TREE =_getAllFilesFromFolder(__dirname + "../../../public/js/visualizations/TREE");
    modules.TABLE =_getAllFilesFromFolder(__dirname + "../../../public/js/visualizations/TABLE");
    modules.STREAM =_getAllFilesFromFolder(__dirname + "../../../public/js/visualizations/STREAM");
    res.send(modules);
  });
  
};