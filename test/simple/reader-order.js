
var test = require('tap').test;
var async = require('async');
var endpoint = require('endpoint');

var setup = require('../setup.js')();

var LOG_TIME = Math.floor(Date.now() / 1000);
var HOUR = 3600;
var writes = {
  'A': LOG_TIME + 2 * HOUR,
  'B': LOG_TIME + 1 * HOUR,
  'C': LOG_TIME + 0 * HOUR,
  'D': LOG_TIME + 0 * HOUR,
  'E': LOG_TIME + 0 * HOUR,
  'F': LOG_TIME + 0 * HOUR,
  'G': LOG_TIME - 1 * HOUR,
  'H': LOG_TIME - 2 * HOUR,
  'I': LOG_TIME - 3 * HOUR,
  'J': LOG_TIME - 4 * HOUR
};

setup.open();

test('write 10 logs', function (t) {
  function log(letter, done) {
    var writeRequest = {
      'type': 'write',
      'id': 0,
      'seconds': writes[letter],
      'milliseconds': 500,
      'level': 1,
      'message': new Buffer('message - ' + letter)
    };

    setup.storage.write(writeRequest, function (err, response) {
      t.equal(err, null);
      t.deepEqual(response, {
        'error': null,
        'id': 0,
        'type': 'write'
      });
      done();
    });
  }

  async.each(Object.keys(writes), log, t.end.bind(t));
});

test('order for all messages', function (t) {
  setup.storage.reader({
    startSeconds: null,
    startMilliseconds: null,
    endSeconds: null,
    endMilliseconds: null,
    levels: [1, 9]
  }).pipe(endpoint({ objectMode: true }, function (err, items) {
    t.equal(err, null);
    var messages = items.slice(0, -1).map(function (item) {
      return item.message.toString();
    });

    t.deepEqual(messages, Object.keys(writes).map(function (letter) {
      return 'message - ' + letter;
    }));

    t.end();
  }));
});

setup.close();
