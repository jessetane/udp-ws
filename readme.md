# udp-ws
UDP <> WebSocket bridge with PSK auth.

## How
Server process:
``` shell
UDP_HOST=127.0.0.1 \
UDP_PORT=1457 \
WS_HOST='[::]' \
WS_PORT=8080 \
PRE_SHARED_KEY=secret \
  node udp-ws/index.js
```

TLS proxy of your choosing (TLS is required for PSK auth):
```
server.com:443 <> server.com:8080
```

Client javascript:
``` javascript
const s = new WebSocket('wss://server.com')
// first message must be 'ro' for readonly access
// or 'rw:<secret>' for read and write access
s.send('rw:secret')
```
