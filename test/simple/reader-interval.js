
var test = require('tap').test;
var endpoint = require('endpoint');

var setup = require('../setup.js')();

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

test('no interval', function (t) {
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
      'message - 1',
      'message - 2',
      'message - 3',
      'message - 4'
    ]);
    t.end();
  }));
});

test('no range level interval', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 1]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, [
      'message - 1'
    ]);
    t.end();
  }));
});

test('half range level interval', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [2, 3]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, [
      'message - 2',
      'message - 3'
    ]);
    t.end();
  }));
});

test('outside level interval', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [8, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, []);
    t.end();
  }));
});

test('simple time interval', function (t) {
  setup.storage.reader({
    startSeconds: 1000,
    startMilliseconds: 0,
    endSeconds: 2500,
    endMilliseconds: 0,
    levels: [1, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, [
      'message - 1',
      'message - 2'
    ]);
    t.end();
  }));
});

test('single timestamp interval', function (t) {
  setup.storage.reader({
    startSeconds: 2000,
    startMilliseconds: 500,
    endSeconds: 2000,
    endMilliseconds: 500,
    levels: [1, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, [
      'message - 1'
    ]);
    t.end();
  }));
});

test('no start time interval', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: 2500,
    endMilliseconds: 0,
    levels: [1, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, [
      'message - 1',
      'message - 2'
    ]);
    t.end();
  }));
});

test('no end time interval', function (t) {
  setup.storage.reader({
    startSeconds: 2500,
    startMilliseconds: 0,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    items = items.slice(0, -1).map(function (item) { return item.message.toString(); });
    t.deepEqual(items, [
      'message - 3',
      'message - 4'
    ]);
    t.end();
  }));
});

setup.close();
