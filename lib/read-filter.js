
var util = require('util');
var stream = require('stream');

function ReadFilter(source, levels) {
  stream.Transform.call(this, {
    objectMode: true,
    highWaterMark: 16
  });
  var self = this;

  this._source = source;
  this._levels = levels;
  this._error = null;

  source.once('error', function (err) {
    self._error = err;
    self.destroy();
  });
  source.pipe(this);
}
util.inherits(ReadFilter, stream.Transform);
module.exports = ReadFilter;

ReadFilter.prototype._transform = function (row, encoding, done) {
  var level = row.key.readUInt8(8);

  if (this._levels[0] <= level && level <= this._levels[1]) {
    this.push({
      'type': 'read-start',
      'level': level,
      'seconds': row.key.readUInt32BE(0),
      'milliseconds': row.key.readUInt16BE(4),
      'message': row.value
    });
  }

  done(null);
};

ReadFilter.prototype._flush = function (done) {
  this.push({
    'type': 'read-stop',
    'error': this._error
  });

  done(null);
};

ReadFilter.prototype.destroy = function () {
  this._source.once('close', this.end.bind(this));
  this._source.destroy();
};
