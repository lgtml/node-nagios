/*jshint node:true */
'use strict';

module.exports = NagiosParser;

var util = require('util');
var fs = require('fs');
var events = require('events');


function NagiosParser(opts) {
  if (!opts) {
    throw new Error('Require Options Object');
  }

  if (!opts.files) {
    throw new Error('Files Sub-object required');
  }
 
  var self = this;
  self.files = {};
  self.watcher = {};

  Object.keys(opts.files).forEach(function(optFile) {
    self.files[optFile] = opts.files[optFile];
  });

  //Verify Files
  Object.keys(self.files).forEach(function(file) {
    _verifyFile(self.files[file], function(err, isValid) {
      if (err) {
        throw new Error(err.path, err.message);
      }

      if (isValid) {
        self.emit('file-ready', file);
      }
    });
  });


  events.EventEmitter.call(this);
}

util.inherits(NagiosParser, events.EventEmitter);
NagiosParser.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: NagiosParser,
    enumerable: false
  }
}); 


NagiosParser.prototype.readFile = function (type, cb) {
  var self = this;
  if (self.files[type] === undefined) {
    var errMsg = { fileType: type, message: "File Type not recognized" };

    self.emit('error', errMsg);
    return cb(errMsg, null);
  }

  fs.readFile(self.files[type], function(err, data) {
    if (err) {
      self.emit('error', err);
      return cb(err);
    }
    var res = [];
    var matches = data.toString().match(/\w+\s\{([^}]+)\}/g).slice(1);
  
    matches.forEach(function(match) {
      var type = match.match(/\s*(\w+)\s*\{/).slice(1)[0];
      var args = match.replace(/\w+\s\{/,'').replace(/\}/,'').replace(/ {2,}/g,'');
      var obj = { type: type, args: {} };
  
      args.split(/\n/).forEach(function(arg) {
        var splitArg = arg.split('=');
        var key = splitArg[0];
        var value = splitArg[1];
        if (!value) {
          return;
        }
        obj.args[key] = value;
      });
      res.push(obj);
    });

    self.emit(type, res);
    return cb(null, res);
  });

};

NagiosParser.prototype.watchFile = function (type, cb) {
  if (!cb) {
    throw new Error("Call back required");
  }

  var self = this;
  var errMsg;

  if (self.files[type] === undefined) {
    errMsg = { fileType: type, message: "File Type not recognized" };
    
    self.emit('error', errMsg);
    return cb(errMsg);
  }

  if (self.watcher[type] === undefined) {
    self.watcher[type] = fs.watch(
      self.files[type],
      {},
      self._callListener.bind(self, type)
    );
  } 
 
  cb(null, self.watcher[type]);
};

NagiosParser.prototype._callListener = function(type, evt, filepath) {
  var self = this;
  self.emit(evt, type);
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
        return cb(errMsg, false);
      }

      cb(null, true);
    });
       
  });
}

