
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();
var match = require('../match.js');

setup.open();

test('write a few messages', function (t) {
  var writeRequest = {
    'type': 'write',
    'id': 0,
    'seconds': 0,
    'milliseconds': 500,
    'level': 1,
    'message': new Buffer(0)
  };

  t.test('message 1', function (t) {
    writeRequest.level = 1;
    writeRequest.seconds = 2000;
    writeRequest.message = new Buffer('message - 1');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.equal(response.error, null);
      t.end();
    });
  });

  t.test('message 2', function (t) {
    writeRequest.level = 2;
    writeRequest.seconds = 2001;
    writeRequest.message = new Buffer('message - 2');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.equal(response.error, null);
      t.end();
    });
  });

  t.test('message 3', function (t) {
    writeRequest.level = 3;
    writeRequest.seconds = 2999;
    writeRequest.message = new Buffer('message - 3');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.equal(response.error, null);
      t.end();
    });
  });

  t.test('message 4', function (t) {
    writeRequest.level = 4;
    writeRequest.seconds = 3000;
    writeRequest.message = new Buffer('message - 4');
    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.equal(response.error, null);
      t.end();
    });
  });
});

test('destroy on readable', function (t) {
  var stream = setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 9]
  });

  var lastReadable = false;

  stream.once('readable', function () {
    stream.once('readable', function () {
      lastReadable = true;
      t.deepEqual(stream.read(), {
        'type': 'read-stop',
        'error': null
      });
    });

    stream.destroy();
    stream.read();
  });

  stream.once('end', function () {
    t.ok(lastReadable);
    t.end();
  });
});

test('destroy on error', function (t) {
  var stream = setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 9]
  });

  var lastReadable = false;

  stream.once('readable', function () {
    lastReadable = true;
    match(t, stream.read(), {
      'type': 'read-stop',
      'error': new Error('fake error')
    });
  });

  stream._source.emit('error', new Error('fake error'));

  stream.once('end', function () {
    t.ok(lastReadable);
    t.end();
  });
});

setup.close();
