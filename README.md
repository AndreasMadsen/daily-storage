#daily-storage

> [daily](https://github.com/AndreasMadsen/daily) - The LevelDB storage abstaction

## Installation

```sheel
npm install daily-storage
```

## Documentation

**Unless you want to write your own low-level daily interfaces you don't need this module.**

When requiring the module you get an constructor:

```javascript
var DailyStorage = require('daily-storage');
```

You should then use this constructor to open (or create) a LevelDB database
there will or do contain all the logs.

```javascript
var storage = new DailyStorage(path, options);
```

The `path` argument is a string pointing to where the database should or do
exists.

The `options` object is optional and can contain the following properties:

```javascript
{
  'timecache': Number,
  // Default: 10, because LevelDB requires unique keys an internal UInt16BE
  // incrementer is used for dublicate timestamps. To ensure fast write an
  // internal memory cache keeps track of this incrementer. This is approximatly
  // the amount time that this incrementer cache will live. Note, that when
  // no cache exists the database is queried.

  'maxage': [Number, ...],
  // Default: [MONTH * 2, MONTH, WEEK * 2, WEEK, DAY], this teels for how many
  // seconds a log entry will exists. Note that the time will depend on the log
  // `level` paramenter. The log levels gos from 1 to 9 so each `array index + 1`
  // correspond to a specific level. If the array is to short, zero seconds is
  // assumed meaning that such level don't exists.

  'db': {},
  // Default: {}, The LevelUP options as you know them, the only diffrence is that
  // keyEncoding and valueEncoding is always `binary`.
}
```

### storage.write(request, callback)

You pass in a [write::request](https://github.com/AndreasMadsen/daily-protocol#write----request)
object and the callback will return a [write::response](https://github.com/AndreasMadsen/daily-protocol#write----response)
object both are similar to those defined in [daily-protocol](https://github.com/AndreasMadsen/daily-protocol):

```javascript
storage.write({
  'type': 'write',
  'id': Number(UInt16),
  'seconds': Number(UInt32)
  'milliseconds': Number(UInt16),
  'level': Number(UInt8),
  'message': new Buffer()
}, function (err, response) {
  // If an error occurred it will be included in the `response` object, so `err`
  // is actually always `null`.
  response = {
    'type': 'write',
    'id': Number(UInt16),
    'error': new Error() || null
  };
});
```

### reader = storage.reader(request)

This methods takes a [read-start::request](https://github.com/AndreasMadsen/daily-protocol#read-start----request)
object and returns a `ReadableStream`.

This stream will then output [read-start::response](https://github.com/AndreasMadsen/daily-protocol#read-start----response)
objects for each log entry.

When the stream stops it will output
a [read-stop::response](https://github.com/AndreasMadsen/daily-protocol#read-stop----response)
object. In general there are 3 ways it can stop:

* an error occurres (the error object will be included in the `read-stop::response` object
* `reader.destory()` is called
* no more data exists.

Very simple example on how read data using the [daily-protocol](https://github.com/AndreasMadsen/daily-protocol)
module and a `storage.reader` object.

```javascript
var socket = dailyProtocol.Server(socket);

var reader = storage.reader(request);
    reader.pipe(socket);

socket.once('data', function (request) {
  if (request.type === 'read-stop') reader.destroy();
});
```

### storage.close()

Close the database and all stuff maintaining it.

### storage.on('error')

Errors emitted here are usually caused by the garbage collector.

### storage.on('close')

Emitted after the `.close` call.

##License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
