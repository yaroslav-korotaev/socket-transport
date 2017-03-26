const EventEmitter = require('events');

class SocketTransport extends EventEmitter {
  constructor(socket) {
    super();
    
    let buf = '';
    let length = 0;
    let readable, i, json, message;
    let fail = null;
    
    this.onData = chunk => {
      buf += chunk;
      if (buf.length > SocketTransport.MAX_BUF_LENGTH)
        return socket.destroy(new Error('buffer overflow'));
      readable = true;
      while (readable) {
        readable = false;
        if (!length) {
          i = buf.indexOf('#');
          if (i != -1) {
            length = parseInt(buf.substring(0, i));
            if (isNaN(length) || length <= 0 || length > SocketTransport.MAX_BUF_LENGTH)
              return socket.destroy(new Error('invalid length'));
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
            return socket.destroy(err);
          }
          this.emit('message', message);
          readable = true;
        }
      }
    };
    this.onError = err => fail = err;
    this.onClose = () => {
      this.open = false;
      this.emit('close', fail);
    };
    
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
  
  send(message) {
    const json = JSON.stringify(message);
    this.socket.write(json.length + '#' + json, 'utf8');
  }
  
  close() {
    this.open = false;
    this.socket.destroy();
  }
}

SocketTransport.MAX_BUF_LENGTH = 65536;

module.exports = SocketTransport;
