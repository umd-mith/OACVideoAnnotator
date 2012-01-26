/*
* Setting up proxy server to import and export
* OAC data
* Copied from Jim Smith simple-proxy.js
*/

(function() {
  var http, io, url;

  io = require('socket.io').listen(8080);

  http = require('http');

  url = require('url');

  io.set('log level', 1);

  io.sockets.on('connection', function(socket) {
    return socket.on('GET', function(data) {
      var options;
      options = url.parse(data.url);
      options.path = options.pathname;
      return http.get(options, function(res) {
        var body;
        res.setEncoding('utf8');
        body = '';
        res.on('data', function(chunk) {
          if (chunk != null) return body += chunk;
        });
        res.on('end', function() {
          return socket.emit('RESPONSE', {
            id: data.id,
            content: body
          });
        });
        return res.on('error', function(e) {
          return socket.emit('RESPONSE', {
            id: data.id,
            error: e.message
          });
        });
      });
    });
  });

}).call(this);

