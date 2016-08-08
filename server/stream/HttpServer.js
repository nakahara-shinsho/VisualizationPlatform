function HttpServer(base_path, http_port, mq) {
  var client_path = base_path + '/../'+ GLOBAL.config.get('Http.client.path');

  var app= require('express')(),
    bodyParser    = require('body-parser'),
    cookieParser  = require('cookie-parser'),
    compression   = require('compression'),
    favicon       = require('serve-favicon'),
    methodOverride= require('method-override'),
    cookieSession = require('cookie-session'),
    errorHandler  = require('errorhandler'),
    serveStatic = require('serve-static'),
    csrf = require('csurf'),
    sqlite3 = require('sqlite3').verbose(),
    fs = require('fs');
   
  var dbname = (process.env.DB || GLOBAL.config.get('FrontEnd.database.name'));
      db = new sqlite3.Database(base_path  + '/db/' + dbname + '.db'  );
      
  var recursiveRoutes = function(folderName) {
    
    fs.readdirSync(folderName).forEach(function(file) {
      var fullName = folderName+'/' +file;
      var stat = fs.lstatSync(fullName);
      
      if (stat.isDirectory()) {
        if(file.startsWith('.') <= -1){
           console.log("skip folder ('" + fullName + "')");
        } else {
          recursiveRoutes(fullName);
          console.log("enter folder ('" + fullName + "')");
        }
      } else{
          var index = fullName.toLowerCase().indexOf('.js');
          var moduleName = file.substring(0, file.indexOf('.js'));
          if (index >=0 ) {
            console.log("require('" + fullName + "') ");
            var onem = (require(fullName.substring(0, index)))[moduleName];
            onem(app,db);
          }else{
            console.log("skip file ('" + fullName + "')" );
          }
      }
    });
  };
  
  // Allow node to be run with proxy passing
  app.enable('trust proxy', 1);

  // Compression (gzip)
  app.use(compression());
  
  //PUT or DELETELE inplace if browser does not support it
  app.use(methodOverride());

  //app.use(logger('dev'));
  app.use(bodyParser.json({limit: '5mb'}));
  app.use(bodyParser.urlencoded({limit: '5mb', extended: true }));
  //app.use(multer());
  app.use(serveStatic(client_path));
  
  // Cookie config to populate req.signedCookies
  app.use(cookieParser(GLOBAL.config.get('Http.session.cookieSecret') ) );
  //to populate req.session, needed for CSRF
  app.use(cookieSession({keys:
                      [GLOBAL.config.get('Http.session.sessionSecret') ] } ) );
  app.use(csrf());

  // error handler
  app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
      // handle CSRF token errors here
      res.status(403);
      res.send('session has expired or form tampered with');
    return ;
  });
  
  // view engine setup
  // We need serverside view templating to initially set the CSRF token in the <head> metadata
  // Otherwise, the html could just be served statically from the public directory
  app.set('view engine', 'html');
  app.set('views', base_path + '/views');
  app.engine('html', require('hbs').__express);
  app.set('port', http_port); 

  app.use(favicon( client_path+'/imgs/favicon.ico', {
    maxAge: 2592000000
  }));
  
  try{
    recursiveRoutes(base_path+'/router');
  }catch(err){
    errorHandler(err);
  }
  
  //print all router list
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(r.route.stack[0].method+ ', '+ r.route.path);
    }
  });
  
  // error handling middleware should be loaded after the loading the routes
  if ('development' === app.get('env')) {
    app.use(errorHandler());
  }
  this.express = app;
  this.server = app.listen(app.get('port'), function () {
    console.log('STARTUP:: Express server(', base_path, ') listening on port', app.get('port'));
  });

  // Close the db connection on process exit  (should already happen, but to be safe)
  process.on("exit", function(){
    db.close();
  });

}

module.exports = HttpServer;

