var amqp = require('amqplib');
var config = require('config') ;
var fs = require('fs');

var gconfig = JSON.parse( fs.readFileSync(__dirname+'/config.json', 'utf8') );
var entrance = gconfig.dataPath.toString();
var dbs ={};

/// PLEASE SET PATH;
var fplusWorkersPath = __dirname +"/fplus_workers";
if(fplusWorkersPath === undefined){
    console.log("[ERROR] Please Set Fplus Workers Path!!");
    process.exit(1);
}


amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var mqBackend = new (require('./utils/MqBackend'))(ch);

    // common
    setInterval(function(){
      mqBackend.starts("ConfusionMatrix", entrance, ['fplus_matrix'], new (require(fplusWorkersPath+'/fplus_confusionMatrix'))(dbs));
      // scenario 1-1
      mqBackend.starts("SourceCodeView", entrance, ['fplus_source'], require(fplusWorkersPath+'/fplus_SourceCodeView'));
      mqBackend.starts("TABLE", entrance, ['fplus_errorData'], new (require(fplusWorkersPath+'/fplus_ErrorData'))(dbs));
      mqBackend.starts("TABLE", entrance, ['fplus_factorTimeAgg'], new (require(fplusWorkersPath+'/fplus_FactorTimeAgg'))(dbs));
      mqBackend.starts("TABLE", entrance, ['fplus_factorFile'], new (require(fplusWorkersPath+'/fplus_FactorFile'))(dbs));
      mqBackend.starts("TABLE", entrance, ['fplus_factorFunction'], new (require(fplusWorkersPath+'/fplus_FactorFunction'))(dbs));
       mqBackend.starts("TABLE", entrance, ['fplus_factorLine'], new (require(fplusWorkersPath+'/fplus_FactorLine'))(dbs));
      mqBackend.starts("TABLE", entrance, ['fplus_factorPC'], new (require(fplusWorkersPath+'/fplus_FactorPC'))(dbs));


      mqBackend.starts("TABLE", entrance, ['fplus_errorDataSet'], new (require(fplusWorkersPath+'/fplus_ErrorDataSet'))(dbs));

      // point coverage
      mqBackend.starts("TABLE", entrance, ['fplus_pointQuadrant'], new (require(fplusWorkersPath+'/fplus_pointQuadrant'))(dbs));
      mqBackend.starts("TABLE", entrance, ['fplus_setCoverageQuadrant'], new (require(fplusWorkersPath+'/fplus_setCoverageQuadrant'))(dbs));
      mqBackend.starts("TABLE", entrance, ['fplus_timeCoverageCountFourAgg'], new (require(fplusWorkersPath+'/fplus_TimeCoverageCountFourAgg'))(dbs));

      // scenario 5-*
      mqBackend.starts("TABLE", entrance, ['scenario5-1:TimeSeriesWithoutEvent'], new (require(fplusWorkersPath+'/fplus_scenario5_1_timeseriesWithoutEvent'))(dbs));
      mqBackend.starts("TABLE", entrance, ['scenario5-1:TimeSeriesWithEvent'], new (require(fplusWorkersPath+'/fplus_scenario5_1_timeseriesWithEvent'))(dbs));
     mqBackend.starts("TABLE", entrance, ['scenario5-1:故障注入->故障検出'], new (require(fplusWorkersPath+'/fplus_scenario5_1_fi2error'))(dbs));
      mqBackend.starts("TABLE", entrance, ['scenario5-1:故障検出->異常検出'], new (require(fplusWorkersPath+'/fplus_scenario5_1_error2fault'))(dbs));
      mqBackend.starts("TABLE", entrance, ['scenario5-1:故障検出->リカバリ'], new (require(fplusWorkersPath+'/fplus_scenario5_1_error2recovery'))(dbs));
      mqBackend.starts("TABLE", entrance, ['scenario5-1:TestList'], new (require(fplusWorkersPath+'/fplus_scenario5_1_testlist'))(dbs));
	mqBackend.starts("TABLE", entrance, ['scenario5-1:EventTable'], new (require(fplusWorkersPath+'/fplus_scenario5_1_eventtable'))(dbs));

    }, 3000);
  });

}).then(null, console.warn);
