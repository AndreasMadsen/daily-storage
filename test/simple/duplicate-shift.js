
var test = require('tap').test;
var endpoint = require('endpoint');

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
    'message': new Buffer('future - 1')
  };

  setup.storage.write(writeRequest, function (err, result) {
    t.equal(err, null);
    t.equal(result.error, null);
    t.end();
  });
});

test('write a second log to ensure max counter is fetched corretly later', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': LOG_SECOND,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer('future - 2')
  };

  setup.storage.write(writeRequest, function (err, result) {
    t.equal(err, null);
    t.equal(result.error, null);
    t.end();
  });
});

test('awit current counter cleanup', function(t) {
  // Validate that a current counter was made
  t.equal(setup.storage._keys._seconds[LOG_SECOND].constructor.name, 'SecondCurrent');

  setTimeout(function() {
    // Validate that the counter was remoted
    t.equal(Object.keys(setup.storage._keys._seconds).length, 0);

    t.end();
  }, 3000);
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

test('awit past counter cleanup', function(t) {
  // Validate that a current counter was made
  t.equal(setup.storage._keys._seconds[LOG_SECOND].constructor.name, 'SecondPast');

  setTimeout(function() {
    // Validate that the counter was remoted
    t.equal(Object.keys(setup.storage._keys._seconds).length, 0);

    t.end();
  }, 2000);
});

test('expect two logs in database', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    t.equal(items.length, 4);
    t.end();
  }));
});

setup.close();
