
var fs = require('fs');
var test = require('tap').test;
var path = require('path');
var rimraf = require('rimraf');
var DailyStoreage = require('../daily-storage.js');

var DB_PATH = path.resolve(__dirname, 'temp.db');

function ServerSetup() {
  if (!(this instanceof ServerSetup)) return new ServerSetup();

  if (fs.existsSync(DB_PATH)) rimraf.sync(DB_PATH);
  this.storage = null;
}
module.exports = ServerSetup;

ServerSetup.prototype.open = function (settings) {
  var self = this;

  test('open daily server', function (t) {
    self.storage = new DailyStoreage(DB_PATH, settings);
    t.end();
  });
};

ServerSetup.prototype.close = function () {
  var self = this;

  test('close daily server', function (t) {
    self.storage.once('close', t.end.bind(t));
    self.storage.close();
  });
};
