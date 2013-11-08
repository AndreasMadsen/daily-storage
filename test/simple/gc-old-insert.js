
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();

var ALWAYS_OLD_SECOND = 0;
var CONDITION_OLD_SECIND = Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 2);

setup.open();

test('write old message', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': 0,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer(0)
  };

  t.test('always old message', function (t) {
    writeRequest.level = 1;
    writeRequest.seconds = ALWAYS_OLD_SECOND;
    writeRequest.message = new Buffer('always old message');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.equal(response.error, null);
      t.end();
    });
  });

  t.test('too old message', function (t) {
    writeRequest.level = 5;
    writeRequest.seconds = CONDITION_OLD_SECIND;
    writeRequest.message = new Buffer('too old message');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.equal(response.error, null);
      t.end();
    });
  });

  t.test('not too old message', function (t) {
    writeRequest.level = 4;
    writeRequest.seconds = CONDITION_OLD_SECIND;
    writeRequest.message = new Buffer('not too old message');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.equal(response.error, null);
      t.end();
    });
  });
});

test('old messages should not be stored', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, [
      'not too old message'
    ]);
    t.end();
  }));
});

setup.close();
