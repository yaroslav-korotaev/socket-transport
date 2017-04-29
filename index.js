const EventEmitter = require('events');
const net = require('net');

class SocketTransport extends EventEmitter {
  constructor(socket) {
    super();
    
    let buf = '';
    let length = 0;
    let readable, i, json, message; // eslint-disable-line one-var
    
    this.onData = chunk => {
      buf += chunk;
      if (buf.length > SocketTransport.MAX_BUF_LENGTH)
        return this.close(new Error('buffer overflow'));
      readable = true;
      while (readable) {
        readable = false;
        if (!length) {
          i = buf.indexOf('#');
          if (i != -1) {
            length = parseInt(buf.substring(0, i));
            if (isNaN(length) || length <= 0 || length > SocketTransport.MAX_BUF_LENGTH)
              return this.close(new Error('invalid length'));
            buf = buf.substring(i + 1);
          }
        }
        if (length && buf.length >= length) {
          json = buf.slice(0, length);
          buf = buf.slice(length);
          length = 0;
          try {
            message = JSON.parse(json);
          } catch (err) {
            return this.close(err);
          }
          this.emit('message', message);
          readable = true;
        }
      }
    };
    this.onError = err => this.close(err);
    this.onClose = () => this.close();
    
    socket.setEncoding('utf8');
    socket.setNoDelay(true);
    socket.on('data', this.onData);
    socket.on('error', this.onError);
    socket.on('close', this.onClose);
    this.socket = socket;
    this.open = true;
  }
  
  detach() {
    const socket = this.socket;
    socket.removeListener('data', this.onData);
    socket.removeListener('error', this.onError);
    socket.removeListener('close', this.onClose);
    this.socket = null;
    return socket;
  }
  
  send(message, callback) {
    const json = JSON.stringify(message);
    return this.socket.write(json.length + '#' + json, 'utf8', callback);
  }
  
  close(err) {
    if (!this.open)
      return;
    
    this.socket.destroy();
    this.open = false;
    
    this.emit('close', err);
  }
}

SocketTransport.connect = function connect(options, callback) {
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
  
  function close() {
    callback(fail || new Error('connection failed'));
  }
  
  socket.on('connect', connect);
  socket.on('error', error);
  socket.on('close', close);
  
  return socket;
};

SocketTransport.MAX_BUF_LENGTH = 65536;

module.exports = SocketTransport;
