var path = require('path');
var NagiosParser = require('../lib/parser.js');

var opts = {
  'files': {
    'status': path.join(__dirname, 'example/status.dat')
  }
};
var parser = new NagiosParser(opts);
parser.on('change', _changeHandler);
parser.on('rename', _changeHandler);

parser.on('file-ready', function(fileType) {
  parser.watchFile(fileType, function(err, res) {
    //RES is the fs.watch obj
    console.log('WATCH ERR', err);
  });
});

function _readFile(fileType) {
  parser.readFile(fileType, function(err, res) {
    console.log(res);
  });
}

function _changeHandler(fileType) {
    _readFile(fileType);
}
