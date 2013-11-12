
var util = require('util');
var async = require('async');
var events = require('events');

var nowsec = require('./now-second.js');

var ONE_MINUT = 60;
var TEN_MINUT = 10 * ONE_MINUT;
var ONE_HOUR = 60 * ONE_MINUT;

function intervalTime(maxage) {
  var firstZero = maxage.indexOf(0);
  if (firstZero !== -1) {
    maxage = maxage.slice(0, firstZero);
  }
  return maxage.pop();
}

function initialNextVisit(maxage) {
  var nextVisit = [];
  var now = nowsec();

  for (var i = 0, l = maxage.length; i < l; i++) {
    if (maxage[i] === 0) break;

    // This startup might be after a crash, in that case don't wait the full
    // maxage time before cleaning, an hour should do fine. The reason for not
    // cleaning immediately is to allow any queue to be drained fast.
    nextVisit.push( now + Math.min(ONE_HOUR, maxage[i]) );
  }

  return nextVisit;
}

function GarbageCollector(database, maxage) {
  var self = this;
  events.EventEmitter.call(this);

  this._database = database;

  this._maxage = maxage;
  this._nextVisit = initialNextVisit(maxage);

  this._cleaning = false;
  this._cleanTimer = setInterval(clean, intervalTime(maxage) * 1000);
  function clean() { self._cleanup(); }
}
util.inherits(GarbageCollector, events.EventEmitter);
module.exports = GarbageCollector;

// Creates a buffer used for sorted search
function timestampBuffer(seconds, milliseconds, fill) {
  var buf = new Buffer(9);
      buf.fill(fill);
      buf.writeUInt32BE(seconds, 0);

  return buf;
}

GarbageCollector.prototype._collect = function (topLevelIndex, done) {
  var self = this;
  var topMaxage = this._maxage[topLevelIndex];

  // Precompute current maxage array
  var now = nowsec();
  var maxage = [Infinity]; // level 0 can't exists, if it dose remove it
  for (var i = 0, l = this._maxage.length; i < l; i++) {
    maxage.push(now - this._maxage[i]);
  }

  // In case this is the longest lasting level there will be no other chache
  // to clean it up, so in case of very bad race conditions and other time
  // related issues. To prevent logs from saying forever, do a scan from time 0.
  var tstart = topLevelIndex === 0 ? 0 : now - 2 * topMaxage - ONE_MINUT;
  var tend = now - topMaxage;

  // Create key stream in the relevant interval
  var keystream = this._database.createKeyStream({
    'start': timestampBuffer(tstart, 0x00),
    'end': timestampBuffer(tend, 0xff)
  });

  // Create a delete batch
  var batch = [];
  keystream.on('data', function (key) {
    var level = key.readUInt8(8);
    if (key.readUInt32BE(0) <= maxage[level]) {
      batch.push({ 'type': 'del', 'key': key });
    }
  });

  // Catch keystream errors
  var eventError = null;
  keystream.once('error', function (err) { eventError = err; });

  // Execute batch ones no more keys exists
  keystream.once('close', function () {
    if (eventError) {
      self._nextVisit[topLevelIndex] = now + TEN_MINUT;
      return done(eventError);
    }

    self._database.batch(batch, function (err) {
      if (err) {
        self._nextVisit[topLevelIndex] = now + TEN_MINUT;
      } else {
        self._nextVisit[topLevelIndex] = now + topMaxage;
      }

      done(err);
    });
  });
};

GarbageCollector.prototype._cleanup = function () {
  if (this._cleaning === true) return;
  this._cleaning = true;

  var self = this;

  // Create a list of levels there needs collecting
  var now = nowsec();
  var needsCollecting = [];
  var i = this._nextVisit.length;
  while (i--) {
    if (now >= this._nextVisit[i]) needsCollecting.push(i);
    else break;
  }

  // Perform the collecting one by one, when done allow more cleaning
  // and emit error if any occurred. The `_nextVisit` update will be performed
  // be the `_collect` method.
  async.eachSeries(needsCollecting, collect, function (err) {
    self._cleaning = false;
    if (err) return self.emit('error', err);
  });

  function collect(levelIndex, done) { self._collect(levelIndex, done); }
};

GarbageCollector.prototype.close = function () {
  clearInterval(this._cleanTimer);
};
