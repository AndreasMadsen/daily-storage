
var test = require('tap').test;
var async = require('async');

var setup = require('../setup.js')();

setup.open({ timecache: 1 });

var LOG_SECOND = Math.ceil(Date.now() / 1000);

test('write a log using future counter', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': LOG_SECOND,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer('future')
  };

  setup.storage.write(writeRequest, function (err, result) {
    t.equal(err, null);
    t.equal(result.error, null);
    t.end();
  });
});

test('awit counter cleanup', function(t) {
   setTimeout(function() {
      t.end();
   }, 2000);
});

test('write a log using past counter', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': LOG_SECOND,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer('past')
  };

  setup.storage.write(writeRequest, function (err, result) {
    t.equal(err, null);
    t.equal(result.error, null);
    t.end();
  });
});

test('expect two logs in database', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 9]
  }).pipe({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    t.equal(items.length, 3);
    t.end();
  });
});

setup.close();
