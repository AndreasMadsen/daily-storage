
// Instead of calling Date.now() all the time, an internal second variable
// is used.
var NOW_SECOND = Math.floor(Date.now() / 1000);
setInterval(function() {
  NOW_SECOND = Math.floor(Date.now() / 1000);
}, 1000).unref();

module.exports = function nowsec() { return NOW_SECOND; };
