
var test = require('tap').test;
var async = require('async');

var setup = require('../setup.js')();

setup.open();

var CRITICAL_LIMIT = Math.pow(2, 16);
var FUTURE_SECOND = Math.ceil(Date.now() / 1000) + 5;

function createQueue(message, amount) {
  var queue = [];
  for (var i = 0; i < amount; i++) {
    queue.push(job);
  }

  function job(done) {
    setup.storage.write(message, done);
  }

  return queue;
}

test('write in past time', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': 2000,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer('past')
  };

  t.test('past - fill up database to the critical limit', function (t) {
    async.parallel(createQueue(writeRequest, CRITICAL_LIMIT + 1), function (err, result) {
      t.equal(err, null);
      var failures = result.filter(function (res) { return res.error !== null; });
      t.equal(failures.length, 1);
     t.end();
    });
  });

  t.test('past - executing future writes will also result in error', function (t) {
    setup.storage.write(writeRequest, function (err, result) {
      t.equal(err, null);
      t.notEqual(result.error, null);
      if (result.error !== null) {
        t.equal(result.error.name, 'RangeError');
        t.equal(result.error.message, 'duplicate incrementer exceeded 16 bit uint capacity');
      }
      t.end();
    });
  });

  t.end();
});

test('write in future time', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': FUTURE_SECOND,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer('future')
  };


  t.test('future - fill up database to the critical limit', {timeout: Infinity }, function (t) {
    async.parallel(createQueue(writeRequest, CRITICAL_LIMIT + 1), function (err, result) {
      t.equal(err, null);
      var failures = result.filter(function (res) { return res.error !== null; });
      t.equal(failures.length, 1);
     t.end();
    });
  });

  t.test('future - executing future writes will also result in error', function (t) {
    global.debug = true;
    setup.storage.write(writeRequest, function (err, result) {
      t.equal(err, null);
      t.notEqual(result.error, null);
      if (result.error !== null) {
        t.equal(result.error.name, 'RangeError');
        t.equal(result.error.message, 'duplicate incrementer exceeded 16 bit uint capacity');
      }
      t.end();
    });
  });

  t.end();
});

setup.close();
