var fs = require('fs');
function getDataPath() {
  var USER_DATA_PATH = process.env.POLYSPECTOR_USER_DATA_PATH;
  if (USER_DATA_PATH != undefined) {
      var entrance = USER_DATA_PATH;
  } else {
      var gconfig = JSON.parse( fs.readFileSync(__dirname+'/../config.json', 'utf8') );
      var entrance = gconfig.dataPath.toString();
  }
  console.log("Read data from " + entrance);
  return entrance;
};
module.exports = getDataPath;
