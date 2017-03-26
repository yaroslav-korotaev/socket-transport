# socket-transport

Transport implementation over Node.js [socket](https://nodejs.org/dist/latest-v6.x/docs/api/net.html#net_class_net_socket) using JSON serialization. Fast and simple, perfect as communication channel between local or remote nodes.

> Read about the Transport concept below.

## Usage

```bash
npm install -s socket-transport
```

### Server

```js
const net = require('net');
const SocketTransport = require('socket-transport');

const server = net.createServer();
server.on('connection', socket => {
  console.log('incoming connection');
  const transport = new SocketTransport(socket);
  transport.on('message', message => {
    console.log('message: %j', message);
  });
  transport.on('close', err => {
    console.log('connection closed');
  });
  transport.send({
    foo: 'bar',
  });
});
server.listen(3000);
```

### Client

```js
const connect = require('socket-transport/client');

connect({
  port: 3000,
  host: 'localhost',
}, (err, transport) => {
  if (err)
    return console.log(err.message);
  console.log('connected');
  transport.on('message', message => {
    console.log('message: %j', message);
  });
  transport.on('close', err => {
    console.log('connection closed');
  });
  transport.send({
    cat: 'meow',
  });
});
```

### SocketTransport API

```js
const SocketTransport = require('socket-transport');
```

#### Properties

##### socket

Reference to the socket passed to the constructor.

#### Methods

##### constructor(socket)

Takes Node.js [socket](https://nodejs.org/dist/latest-v6.x/docs/api/net.html#net_class_net_socket) to attach on.

##### send(message, callback)

> From version 1.0.0

In Socket transport implementation it is possible to pass a callback as a second argument. Callback will be passed directly to `socket.write()` function and called when the message was actually sent. Also, `send()` returns the write status from `socket.write()`. Read more in [Node.js docs](https://nodejs.org/dist/latest-v6.x/docs/api/net.html#net_socket_write_data_encoding_callback).

> For details and other methods see common transport interface below

### Client API

```js
const connect = require('socket-transport/client');
```

##### connect(options, callback)

`options` passed directly to the [net.createConnection()](https://nodejs.org/dist/latest-v6.x/docs/api/net.html#net_net_createconnection_options_connectlistener) Node.js function. Returns Node.js socket.

> For details see common client interface below

#### Static

##### SocketTransport.MAX_BUF_LENGTH

Maximum incoming message size in bytes, defaults to 65536.

## Concept

Transport is an abstraction layer providing uniform interface for message exchange. Message is a plain JavaScript object, and transport knows how to send it to the other party and receive from.

Uniform interface lets you write your application logic once and support different protocols or communication channels simultaneously or even switching them on the fly. After all, it's just a simple API for network messaging.

### Transport interface

Transport class exposed by requiring module directly, sush as `require('socket-transport')`.

#### Events

##### 'message'

`message` - received message, javascipt object  

Emitted when a new message is received.

##### 'close'

`err` - `Error` object or `null`  

Emitted when underlying system (and the transport itself) has been closed. Property `open` will become `false` right before the event. If transport was closed due to error, that error will be passed as `err`.

#### Properties

##### open

Boolean, describes transport is opened or not.

#### Methods

##### constructor(...)

Creates transport using some underlying system, such as TCP-socket or WebSocket. Arguments is to be specified in the specific transport implementation.

##### detach()

Detaches transport from the underlying system, making it possible to reuse it with other transports (for protocol switching on the fly, for example) or something else. Returns the underlying system object, passed to the constructor.

##### send(message)

`message` - javascript object to send  

Sends a message to the other party using some kind of serialization. Sending a message with closed transport does nothing.

##### close(err)

Closes underlying system, making the transport a subject for garbage collection. Property `open` will become `false` immediately and event `close` will be emitted asynchronously after it has been closed. Optional parameter `err` will be passed to `close` event (available from version 1.0.0). Calls to `close()` may or may not emitting `close` event when the transport is already closed.

### Client interface

Connect function exposed by requiring `/client` on a package, sush as `require('socket-transport/client')`.

##### connect(options, callback)

`options` - some options for connecting, depends on implementation  
`callback` - should take parameters `(err, transport)`  

Creates a client connection using `options` and invokes `callback` with `null, transport` when it's done, or just an `err` if connection fails. Returns an underlying system object.
