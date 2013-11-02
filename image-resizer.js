'use strict';

var gmLib = require('gm'),
  fs = require('fs'),
  lib = require('grunt-ez-frontend/lib/lib.js'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  async = require('async'),
  Deferred = require( "JQDeferred" ),
  gm = gmLib.subClass({ imageMagick : true });


var doResize = function (imagePath, opts) {
  
  var dfd = Deferred();

  async.each(opts.sizes, function (size, cb) {
    var 
      imgStream = fs.createReadStream(imagePath),
      basename = path.basename(imagePath),
      sizeInText = lib.format('_{0}_', size),
      outputPath = path.join(opts.outputFolder, 
        sizeInText, 
        path.relative(opts.relativePath, imagePath)
      );

    mkdirp(path.dirname(outputPath), function (err) {
      if (err) {
        throw err;
      }

      gm(imgStream, basename)
        .resize(size, size, '%')
        .write(outputPath, function (err) {
          if (err) {
            throw err;
          }
          cb && cb();
        });

    });
  }, function () {
    dfd.resolve();
  });

  return dfd.promise();
};

module.exports = {
  process : function (files, options) {
    var dfd = Deferred();
    var opts = {
      maxConcurrent : 25
    };

    lib.extend(opts, options);

    async.eachLimit(files, opts.maxConcurrent, function (file, cb) {
      doResize(file, opts).done(function () {
        dfd.notify({
          file : file
        });
        cb && cb();
      });
      
    }, function () {
      dfd.resolve();
    });

    return dfd.promise();
  }

};