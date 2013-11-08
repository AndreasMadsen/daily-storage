
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var match = require('../match.js');

setup.open();

var FUTURE_SECOND = Math.ceil(Date.now() / 1000) + 5;
var PAST_SECOND = Math.ceil(Date.now() / 1000) - 20; // timecache is 10 sec

test('write in past time', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': PAST_SECOND,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer(0)
  };

  t.test('past - insert first log', function (t) {
    writeRequest.message = new Buffer('past - 1');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.deepEqual(response, {
        'type': 'write',
        'id': 0,
        'error': null
      });
      t.end();
    });
  });

  t.test('past - insert second log with same timestamp as first', function (t) {
    writeRequest.message = new Buffer('past - 2');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.deepEqual(response, {
        'type': 'write',
        'id': 0,
        'error': null
      });
      t.end();
    });
  });
});

test('write in future time', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': FUTURE_SECOND,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer(0)
  };

  t.test('future - insert first log', function (t) {
    writeRequest.message = new Buffer('future - 1');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.deepEqual(response, {
        'type': 'write',
        'id': 0,
        'error': null
      });
      t.end();
    });
  });

  t.test('future - insert second log with same timestamp as first', function (t) {
    writeRequest.message = new Buffer('future - 2');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.deepEqual(response, {
        'type': 'write',
        'id': 0,
        'error': null
      });
      t.end();
    });
  });
});

test('check that all logs exists', function (t) {
  var readerRequest = {
    'type': 'read-start',
    'startSeconds': null,
    'startMilliseconds': null,
    'endSeconds': null,
    'endMilliseconds': null,
    'levels': [1, 9]
  };

  setup.storage.reader(readerRequest).pipe(endpoint({objectMode: true}, function (err, rows) {
    t.equal(err, null);
    t.equal(rows.length, 5); // 2 read-start in past, 2 read-start in future and 1 read-stop

    match(t, rows[0], {
      type: 'read-start',
      level: 1,
      seconds: PAST_SECOND,
      milliseconds: 500,
      message: new Buffer('past - 1')
    });

    match(t, rows[1], {
      type: 'read-start',
      level: 1,
      seconds: PAST_SECOND,
      milliseconds: 500,
      message: new Buffer('past - 2')
    });

    match(t, rows[2], {
      type: 'read-start',
      level: 1,
      seconds: FUTURE_SECOND,
      milliseconds: 500,
      message: new Buffer('future - 1')
    });

    match(t, rows[3], {
      type: 'read-start',
      level: 1,
      seconds: FUTURE_SECOND,
      milliseconds: 500,
      message: new Buffer('future - 2')
    });

    match(t, rows[4], {
      type: 'read-stop',
      error: null
    });

    t.end();
  }));
});

setup.close();
