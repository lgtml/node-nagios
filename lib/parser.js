/*jshint node:true */
'use strict';

module.exports = NagiosParser;

var fs = require('fs');
var events = require('events');
var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ]
});


function NagiosParser(opts) {
  if (opts) {
    throw new Error('Require Options Object');
  }

  if (opts.files) {
    throw new Error('Files Sub-object required');
  }
 
  var self = this;
  self.files.status = opts.files.status || '/var/lib/nagios/status.dat';
  self.files.commands = opts.files.commands || '/var/lib/nagios/commands.dat';

  //Verify Files
  Object.keys(self.files).forEach(function(file) {
    _verifyFile(self.files[file], function(err, isValid) {
      if (err) {
        throw new Error(err.path, err.message);
      }

      if (isValid) {
        logger.info(self.files[file] + ' is readable');
      }
    });
  });


  events.EventEmitter.call(this);
}

NagiosParser._super = events.EventEmitter;
NagiosParser.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: NagiosParser,
    enumerable: false
  }
}); 


NagiosParser.prototype.readStatus = function (cb) {
  fs.readFile('./status.dat', function(err, data) {
    var statusDat = data.toString();
    var matches = statusDat.match(/\w+\s\{([^}]+)\}/g).slice(1);
  
    matches.forEach(function(match) {
      var type = match.match(/\s*(\w+)\s*\{/).slice(1)[0];
      var args = match.replace(/\w+\s\{/,'').replace(/\}/,'').replace(/ {2,}/g,'');
      var obj = { type: type, args: {} };
  
      args.split(/\n/).forEach(function(arg) {
        var splitArg = arg.split('=');
        var key = splitArg[0];
        var value = splitArg[1];
        if (value === undefined) return;
        obj.args[key] = value;
      });

     console.log('Match', obj);
    });
  });

};

function _verifyFile(file, cb) {
  var errMsg;
  fs.stat(file, function(err, res) {
    if (err) {
      errMsg = {
        path: err.path,
        message: "File Verify Failed with " + err.code
      };
      return cb(errMsg, false);
    }
    
    if (!res.isFile()) {
      errMsg = {
        path: file,
        message: "Path is not a file"
      };
  
      return cb(errMsg, false);
    }

    fs.readFile(file, function(err, data) {
      if (err) {
        errMsg = {
          path: err.path,
          message: "Could not open file for reading with code " + err.code
        };
        cb(errMsg, false);
      } else {
        cb(null, true);
      }

    });
       
  });
}

