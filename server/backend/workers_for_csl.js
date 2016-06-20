require('./util/wrapperConsoleForLog4js.js')
var amqp = require('amqplib');
var config = require('config') ;
var fs = require('fs');
      gconfig = JSON.parse( fs.readFileSync(__dirname+'/config.json', 'utf8') );
      entrance = gconfig.dataPath.toString();
  
amqp.connect('amqp:'+ config.get('RabbitMQ.server.host')).then(function (conn) {
  return conn.createChannel().then(function (ch) {
    var mqBackend = new (require('./utils/MqBackend'))(ch);
    mqBackend.start('SourceCodeView', entrance, 'SourceCode(test.c)', require('./sourceCodeView'));
    mqBackend.start('$Table', entrance, 'LineChart2'    , require('./lineChart2Test'));
    
    // [CSL]
    mqBackend.start('$Table', entrance, 'fplus_errorData'          , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_ErrorData'));
    mqBackend.start('$Table', entrance, 'fplus_errorDataSet'       , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_ErrorDataSet'));
    mqBackend.start('$Table', entrance, 'fplus_errorDataPoint'     , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_ErrorDataPoint'));
    mqBackend.start('$Table', entrance, 'fplus_setCoverage'        , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_setCoverage'));
    mqBackend.start('$Table', entrance, 'fplus_setCoverageQuadrant', require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_setCoverageQuadrant'));
    mqBackend.start('$Table', entrance, 'fplus_pointQuadrant' , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_pointQuadrant'));
    mqBackend.start('$Table', entrance, 'fplus_factorFile'    , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_FactorFile'));
    mqBackend.start('$Table', entrance, 'fplus_factorFunction', require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_FactorFunction'));
    mqBackend.start('$Table', entrance, 'fplus_factorTimeAgg' , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_FactorTimeAgg'));
    mqBackend.start('$Table', entrance, 'fplus_timeCoverageAgg'    , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_TimeCoverageAgg'));
    mqBackend.start('$Table', entrance, 'fplus_timeCoverageFourAgg', require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_TimeCoverageFourAgg'));
    mqBackend.start('$Table', entrance, 'fplus_timeCoverageCountFourAgg'    , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_TimeCoverageCountFourAgg'));
    
    mqBackend.start('LineChart', entrance, 'fplus_factorLine'   , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_FactorLine'));
    mqBackend.start('LineChart', entrance, 'fplus_factorPC'     , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_FactorPC'));
    mqBackend.start('LineChart', entrance, 'fplus_factorLog'    , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_FactorLog'));
    mqBackend.start('LineChart', entrance, 'fplus_timeCoverage'    , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_TimeCoverage'));
    mqBackend.start('SourceCodeView', entrance, 'fplus_source'  , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_SourceCodeView'));
    mqBackend.start('ConfusionMatrix', entrance, 'fplus_matrix' , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_confusionMatrix'));
    mqBackend.start('LegendChart', entrance, 'fplus_quadrant' , require('/home/kuroda/devel/vispla/workers/fplus/20160411/fplus_Four-quadrant'));
  
  });
}).then(null, console.warn);
