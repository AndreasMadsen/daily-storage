
// Instead of calling Date.now() all the time, an internal second variable
// is used.
var NOW_SECOND;

(function me() {
  var time = Date.now();
  NOW_SECOND = Math.floor(time / 1000);
  var remainder = time % 1000;

  setTimeout(me, Math.max(1000 - remainder, 10)).unref();
})();

module.exports = function nowsec() { return NOW_SECOND; };
