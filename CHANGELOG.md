# Change Log

## 2.0.0 - 2017-05-06

### Transport API
- Move `connect()` method from separate file `client.js` to pakcage root. Now it exposed as static method of Transport class
- Add eslint integration

## 1.0.0 - 2017-03-27

### SocketTransport
- `send()` takes optional callback and returns write status

### Transport API
- `close()` can accept optional `err` parameter and pass it with `close` event
