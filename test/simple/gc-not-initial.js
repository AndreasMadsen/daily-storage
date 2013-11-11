
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var match = require('../match.js');

setup.open({ maxage: [9, 6, 3] });

var NOW_INITIAL = 0;
var NOW_NOT_INITIAL = 0;

var READER_REQUEST = {
  'type': 'read-start',
  'startSeconds': null,
  'startMilliseconds': null,
  'endSeconds': null,
  'endMilliseconds': null,
  'levels': [1, 9]
};

test('write testing log - initial', function (t) {
  NOW_INITIAL =  Math.floor(Date.now() / 1000) - 2;

  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': NOW_INITIAL,
    'milliseconds': 500,
    'level': 2,
    'message': new Buffer('level 2 - first')
  };

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

test('check that test log exists', function (t) {
  setup.storage.reader(READER_REQUEST).pipe(endpoint({objectMode: true}, function (err, rows) {
    t.equal(err, null);
    t.equal(rows.length, 2);

    match(t, rows[0], {
      type: 'read-start',
      level: 2,
      seconds: NOW_INITIAL,
      milliseconds: 500,
      message: new Buffer('level 2 - first')
    });

    match(t, rows[1], {
      type: 'read-stop',
      error: null
    });

    t.end();
  }));
});


test('initial log should be not be collected after 3 sec', function (t) {
  setTimeout(function () {
    setup.storage.reader(READER_REQUEST).pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.equal(rows.length, 2);

      match(t, rows[0], {
        type: 'read-start',
        level: 2,
        seconds: NOW_INITIAL,
        milliseconds: 500,
        message: new Buffer('level 2 - first')
      });

      match(t, rows[1], {
        type: 'read-stop',
        error: null
      });

      t.end();
    }));
  }, 1000 * 3);
});


test('initial log should be collected after 6 sec', function (t) {
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

test('write testing log - not initial', function (t) {
  NOW_NOT_INITIAL =  Math.floor(Date.now() / 1000) - 2;

  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': NOW_NOT_INITIAL,
    'milliseconds': 500,
    'level': 2,
    'message': new Buffer('level 2 - second')
  };

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

test('check that test log exists', function (t) {
  setup.storage.reader(READER_REQUEST).pipe(endpoint({objectMode: true}, function (err, rows) {
    t.equal(err, null);
    t.equal(rows.length, 2);

    match(t, rows[0], {
      type: 'read-start',
      level: 2,
      seconds: NOW_NOT_INITIAL,
      milliseconds: 500,
      message: new Buffer('level 2 - second')
    });

    match(t, rows[1], {
      type: 'read-stop',
      error: null
    });

    t.end();
  }));
});


test('none initial log should be not collected after 3 sec', function (t) {
  setTimeout(function () {
    setup.storage.reader(READER_REQUEST).pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.equal(rows.length, 2);

      match(t, rows[0], {
        type: 'read-start',
        level: 2,
        seconds: NOW_NOT_INITIAL,
        milliseconds: 500,
        message: new Buffer('level 2 - second')
      });

      match(t, rows[1], {
        type: 'read-stop',
        error: null
      });

      t.end();
    }));
  }, 1000 * 3);
});


test('none initial log should be collected after 6 sec', function (t) {
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
