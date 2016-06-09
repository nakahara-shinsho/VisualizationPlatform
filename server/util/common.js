module.exports.errHandle =  function(err) {
  var NestedError = require('nested-error');
  if (typeof err === 'object') {
          if (err.message) {
            console.log('\nMessage: ' + err.message);
          }
          var nestedErr= new NestedError(err);
          if (nestedErr.stack) {
            console.log('\nStacktrace:');
            console.log('====================');
            console.log(nestedErr.stack);
          }
  } else {
          console.log('Error: '+ err);
  }
 };

module.exports.logHandle =  function(msg) {
  console.log(msg);
};