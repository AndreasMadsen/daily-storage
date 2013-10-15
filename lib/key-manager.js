
var endpoint = require('endpoint');

// Instead of calling Date.now() all the time, an internal second variable
// is used.
var NOW_SECOND = Math.floor(Date.now() / 1000);
setInterval(function() {
  NOW_SECOND = Math.floor(Date.now() / 1000);
}, 1000).unref();

function KeyManager(database, maxage) {
  var self = this;

  this._database = database;
  this._seconds = {};
  this._cacheAge = NOW_SECOND;
  this._cacheMaxAge = maxage;

  this._cleanTimer = setTimeout(function () {
    clean();
    self._cleanTimer = setInterval(clean, 1000);
  }, maxage * 1000);

  function clean() { self._cleanup(); }
}
module.exports = KeyManager;

KeyManager.prototype.generateKey = function (second, millisecond, level, callback) {
  // Fetch or create the second object
  var sec = this._seconds[second];
  if (sec === undefined) {
    if (second <= this._cacheAge) {
      sec = this._seconds[second] = new SecondPast(second, this._database);
    } else {
      sec = this._seconds[second] = new SecondCurrent(second, this._database);
    }
  }

  var buf = new Buffer(9);

  // Write static part of buffer
  buf.writeUInt32BE(second, 0);
  buf.writeUInt16BE(millisecond, 4);
  buf.writeUInt8(level, 8);

  // Write id part of buffer
  sec.nextId(millisecond, function (err, counter) {
    if (err) return callback(err, null);

    buf.writeUInt16BE(counter, 6);
    callback(null, buf);
  });
};

KeyManager.prototype._cleanup = function () {
  var oldest = NOW_SECOND - this._cacheMaxAge;

  var keys = Object.keys(this._seconds);
  for (var i = 0, l = keys.length; i < l; i++) {
    var secobj = this._seconds[ keys[i] ];
    if (secobj.cleanable === true && secobj.time <= oldest) {
      delete this._seconds[ keys[i] ];
    }
  }

  // Update the cacheAge so new second objects before this time becomes past
  // second objects.
  this._cacheAge = oldest;
};

KeyManager.prototype.close = function () {
  clearTimeout(this._cleanTimer);
  clearInterval(this._cleanTimer);
};

//
// Second abstactions
//

var MAX_COUNT = Math.pow(2, 16);
var MAX_COUNT_ERROR = new RangeError('duplicate incrementer exceeded 16 bit uint capacity');

function doIdCallback(counter, callback) {
  if (global.debug) console.log(counter);
  if (counter >= MAX_COUNT) {
    callback(MAX_COUNT_ERROR, null);
  } else {
    callback(null, counter);
  }
}

// This is a new second, there is absolutely that anything from this time
// could be in the database previous to the object initialization.
function SecondCurrent(second) {
  this._second = second;
  this._current = {};

  this.cleanable = true;
  this.time = Math.max(second, NOW_SECOND);
}

SecondCurrent.prototype.nextId = function (milliseconds, callback) {
  var counter;

  if (this._current.hasOwnProperty(milliseconds)) {
    counter = this._current[milliseconds] += 1;
  } else {
    counter = this._current[milliseconds] = 0;
  }

  doIdCallback(counter, callback);
};

// It is unkown if something from this time is in the database, it is necessary
// to query the database.
function SecondPast(second, database) {
  this._second = second;
  this._database = database;
  this._current = {};
  this._fetchers = {};
  this._actives = 0;

  this.cleanable = true;
  this.time = Math.max(second, NOW_SECOND);
}

// Creates a buffer used for sorted search
function timestampBuffer(seconds, milliseconds, fill) {
  var buf = new Buffer(9);
      buf.fill(fill);
      buf.writeUInt32BE(seconds, 0);
      buf.writeUInt16BE(milliseconds, 4);

  return buf;
}

SecondPast.prototype._fetchCounter = function (millisecond) {
  var self = this;

  // Create a timestamp `start` and `end` buffers used in a sorted key search
  var tstart = timestampBuffer(this._second, millisecond, 0x00);
  var tend = timestampBuffer(this._second, millisecond, 0xff);

  // Start the reverse single item search
  this._database.createKeyStream({
    'limit': 1,
    'reverse': true,
    'start': tstart,
    'end': tend
  }).pipe(endpoint({objectMode: true}, function (err, keys) {
    if (err) return fetched(err, null);

    // If timestamp dosn't match no item exist and the count is zero
    if (keys.length === 0) return fetched(null, 0);

    // Otherwise read the counter and incease by one
    return fetched(null, keys[0].readUInt16BE(6) + 1);
  }));

  function fetched(err, nextId) {
    var cbs = self._fetchers[millisecond];
    var i = 0, l = cbs.length;

    // Indicate that this millisecond request is done and reset the cleanable
    // to true, if no other requests are in progress.
    this._actives -= 1;
    if (this._actives === 0) {
      this.cleanable = true;
    }

    // Cleanup the callback array
    delete self._fetchers[millisecond];

    // Loop though cbs and execute callback
    if (err) {
      for (; i < l; i++) cbs[i](err, null);
    }
    // Loop though cbs and set millisecond to the currentId
    else {
      for (; i < l; i++) doIdCallback(nextId + i, cbs[i]);
      self._current[millisecond] = nextId + (l - 1);
    }
  }
};

SecondPast.prototype.nextId = function (milliseconds, callback) {
  // This has already been fetched
  if (this._current.hasOwnProperty(milliseconds)) {
    doIdCallback(++this._current[milliseconds], callback);
  }
  // This is being fetched, queue the callbacks to avoid race conditions
  else if (this._fetchers.hasOwnProperty(milliseconds)) {
    this._fetchers[milliseconds].push(callback);
  }
  // We know nothing, create a queue and process it
  else {
    this._fetchers[milliseconds] = [callback];
    this._fetchCounter(milliseconds);

    // Indicate that something is in progress so this object should
    // not be removed.
    this._actives += 1;
    this.cleanable = false;
  }
};
