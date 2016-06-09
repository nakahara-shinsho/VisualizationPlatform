//
module.exports.databroker = function (router, db) {
  //get data as json { data1: {type: 'csv', data: '...'}, data2: ....}
  router.get('/api/data/:virtualTable', function (req, res) {
    GLOBAL.mqFrontend.request(req.params.virtualTable).then(
      function (payload) {
        res.send(payload);
      },
      function (error) {
        console.log(err);
        var err = {};
        err[req.params.virtualTable] = {error: 'server error!'};
        res.send( JSON.stringify(err));
      }
    );
  });
  
   router.post('/api/data/:virtualTable', function (req, res) {
    //console.log('request data: ' + JSON.stringify(req.body));
    GLOBAL.mqFrontend.request(req.params.virtualTable, req.body).then(
     function (payload) {
       res.send(payload);
     },
     function (error) {
       console.log(err);
       var err = {};
       err[req.params.virtualTable] = {error: 'server error!'};
       res.send( JSON.stringify(err));
     }
    );
  });
  
};
