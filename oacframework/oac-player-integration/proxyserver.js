var app = require('http').createServer(handler),
io = require('socket.io').listen(app),
fs = require('fs');

app.listen('8080');

function handler (req, res) {
	fs.readFile('save.rdf',
	  function (err, data) {
	    if (err) {
	      res.writeHead(500);
	      return res.end('Error loading index.html');
	    }

	    res.writeHead(200);
	    res.end(data);
	  });
};

io.sockets.on('connection', function(socket) {
	socket.emit('sendrdf', {});
	
	socket.on('saverdf', function(data) {
		fs.writeFile('save.rdf', data.data, function (err) {
		  if (err) throw err;
		  console.log('It\'s saved!');
		});
	});
	
	
});


