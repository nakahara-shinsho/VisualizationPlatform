module.exports.snapshot = function (app, db) {
  var fs = require('fs');
  app.get('/api/snapshot/:imgname', function(req, res){
      
      console.log('GET request for snapshot accepted: ' + req.params.imgname);
      
      var folder = __dirname + "/../snapshot";
      var emsg = null;
      if (!fs.existsSync(folder)){
        //return error
        //emsg = "No image folder";
      }
    
      var fullpath_file = folder + '/'+ req.params.imgname;
       if (!fs.existsSync(fullpath_file)){
          fullpath_file = __dirname + '/../db/null.jpg';
       }
      
      if(!emsg) {
        fs.stat(fullpath_file, function (err, stat) {
          if(err){
            res.status(500).send(err.message);  
          }else {
                  var img = fs.readFileSync(fullpath_file);
                  res.contentType = 'image/jpeg';
                  res.contentLength = stat.size;
                  res.end(img, 'binary');
          }
        });
      } else {
        res.status(500).send(emsg);
      }
      
  });
  
  app.post('/api/snapshot/:imgname', function(req, res){
      
      console.log('POST request for snapshot accepted: ' + req.params.imgname);
      
      var folder = __dirname + "/../snapshot";
      if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
      }
    
      if(req.body.image){
        var fullpath_file = folder +'/'+ req.params.imgname + req.body.ext;
        var data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(data, 'base64');
        fs.writeFile(fullpath_file, buf);
      }
      
      res.send({});
  });
};