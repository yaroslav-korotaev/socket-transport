const net = require('net');
const SocketTransport = require('./index.js');

function connect(options, callback) {
  const socket = net.createConnection(options);
  let fail = null;
  
  function connect() {
    socket.removeListener('connect', connect);
    socket.removeListener('error', error);
    socket.removeListener('close', close);
    callback(null, new SocketTransport(socket));
  }
  
  function error(err) {
    fail = err;
  }
  
  function close(hadError) {
    callback(fail || new Error('connection failed'));
  }
  
  socket.on('connect', connect);
  socket.on('error', error);
  socket.on('close', close);
  return socket;
}

module.exports = connect;
