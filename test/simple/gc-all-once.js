
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var match = require('../match.js');

setup.open({ maxage: [9, 6, 3] });

var NOW = Math.floor(Date.now() / 1000);
var LEVEL_3 = NOW - 2;
var LEVEL_2 = NOW - 5;
var LEVEL_1 = NOW - 8;

var READER_REQUEST = {
  'type': 'read-start',
  'startSeconds': null,
  'startMilliseconds': null,
  'endSeconds': null,
  'endMilliseconds': null,
  'levels': [1, 9]
};

test('write testing logs', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': 0,
    'milliseconds': 500,
    'level': 0,
    'message': new Buffer(0)
  };

  t.test('level 1', function (t) {
    writeRequest.level = 1;
    writeRequest.seconds = LEVEL_1;
    writeRequest.message = new Buffer('level 1 - first');
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

  t.test('level 2', function (t) {
    writeRequest.level = 2;
    writeRequest.seconds = LEVEL_2;
    writeRequest.message = new Buffer('level 2 - first');
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

  t.test('level 3', function (t) {
    writeRequest.level = 3;
    writeRequest.seconds = LEVEL_3;
    writeRequest.message = new Buffer('level 3 - first');
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
  setup.storage.reader(READER_REQUEST).pipe(endpoint({objectMode: true}, function (err, rows) {
    t.equal(err, null);
    t.equal(rows.length, 4);

    match(t, rows[0], {
      type: 'read-start',
      level: 1,
      seconds: LEVEL_1,
      milliseconds: 500,
      message: new Buffer('level 1 - first')
    });

    match(t, rows[1], {
      type: 'read-start',
      level: 2,
      seconds: LEVEL_2,
      milliseconds: 500,
      message: new Buffer('level 2 - first')
    });

    match(t, rows[2], {
      type: 'read-start',
      level: 3,
      seconds: LEVEL_3,
      milliseconds: 500,
      message: new Buffer('level 3 - first')
    });

    match(t, rows[3], {
      type: 'read-stop',
      error: null
    });

    t.end();
  }));
});

test('all levels should be collected after 2 sec', function (t) {
  setTimeout(function () {
    setup.storage.reader(READER_REQUEST).pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.equal(rows.length, 1);

      match(t, rows[0], {
        type: 'read-stop',
        error: null
      });

      t.end();
    }));
  }, 1000 * 3);
});

setup.close();
