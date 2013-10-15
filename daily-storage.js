
var level = require('level');
var extend = require('util-extend');

var KeyManager = require('./lib/key-manager.js');
var ReadFilter = require('./lib/read-filter.js');

var DAY = 60 * 60 * 24,
    WEEK = DAY * 7,
    MONTH = DAY * 30;

var DEFAULTS = {
  'timecache': 10,
  'maxage': [MONTH * 2, MONTH, WEEK * 2, WEEK, DAY]
};

var DB_SETTINGS = {
  keyEncoding: 'binary',
  valueEncoding: 'binary'
};

function DailyStorage(dbpath, settings) {
  if (!(this instanceof DailyStorage)) return new DailyStorage(dbpath, settings);

  // Apply default settings
  this._settings = extend(extend({}, DEFAULTS), settings);
  this._maxage = completeMaxage(this._settings.maxage);

  // Setup database
  this._database = level(dbpath, extend(extend({}, this._settings.db), DB_SETTINGS));
  this._keys = new KeyManager(this._database, this._settings.timecache);

  // TODO: add automatic cleanup system (using settings.maxage)
}
module.exports = DailyStorage;

function completeMaxage(array) {
  var complete = array.slice(0);
  for (var i = array.length; i < 9; i++) complete.push(0);
  return complete;
}

var INVALID_LOG_LEVEL = new RangeError('invalid log level');

DailyStorage.prototype.write = function (req, callback) {
  var self = this;

  if (req.level < 1 || req.level > 9 || this._maxage[req.level - 1] === 0) {
    return callback(null, { 'type': 'write', 'id': req.id, 'error': INVALID_LOG_LEVEL });
  }

  this._keys.generateKey(req.seconds, req.milliseconds, req.level, function (err, keybuffer) {
    if (err) return callback(null, { 'type': 'write', 'id': req.id, 'error': err });

    self._database.put(keybuffer, req.message, function (err) {
      callback(null, { 'type': 'write', 'id': req.id, 'error': (err || null) });
    });
  });
};

DailyStorage.prototype.reader = function (req) {
  var source = this._database.createReadStream({
    start: timestampBuffer(req.startSeconds, req.startMilliseconds, 0x00),
    end: timestampBuffer(req.endSeconds, req.endMilliseconds, 0xff),
  });

  return new ReadFilter(source, req.levels);
};

// Creates a buffer used for sorted searches
function timestampBuffer(seconds, milliseconds, fill) {
  if (seconds === null) return null;

  var buf = new Buffer(9);
      buf.fill(fill);
      buf.writeUInt32BE(seconds, 0);
      buf.writeUInt16BE(milliseconds, 4);

  return buf;
}

DailyStorage.prototype.close = function (callback) {
  this._keys.close();
  this._database.close(callback);
};
