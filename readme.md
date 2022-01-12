# udp-ws
UDP <> WebSocket bridge with PSK auth.

## How
Server process:
``` shell
UDP_HOST_SEND=127.0.0.1 \
UDP_PORT_SEND=1457 \
UDP_HOST_RECV=255.255.255.255 \
UDP_PORT_RECV=1457 \
WS_HOST=127.0.0.1 \
WS_PORT=8080 \
PRE_SHARED_KEY=secret \
  node udp-ws/index.js
```

TLS proxy of your choosing (TLS is required for safe PSK auth):
```
server.com:443 <> server.com:8080
```

Client javascript:
``` javascript
const s = new WebSocket('wss://server.com')
s.authenticated = false
s.addEventListener('message', evt => {
  if (s.authenticated) {
    console.log('got message', evt.data)
  } else if (evt.data === 'ok') {
    s.authenticated = true
    console.log('auth success')
  } else {
    console.log('auth failure')
  }
})
s.send('secret')
```

## License
MIT
