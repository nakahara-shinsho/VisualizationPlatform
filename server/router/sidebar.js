module.exports.sidebar = function (router, db){
      var url = '/api/sidebar';
      var data = {
            hideMe: true,
            histories: [
              {date: '2013/10/11 12:10:23', user: 'xinxiao li'},
              {date: '2013/10/12 16:10:23', user: 'xinxiao li'},
              {date: '2013/10/13 14:10:23', user: 'xinxiao li'}
            ]
          };
      router.get(url, function (req, res) {
        console.log('Get Request Accepted');
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(data));
        res.end();
      });
      router.post(url, function (req, res) {
        console.log('Post Request Accepted: '+ JSON.stringify(req.body));
        data.hideMe = req.body.hideMe;
        console.log('Post Request : '+ JSON.stringify(data));
        res.send(data);
      });
    };


