// import WebSocket from 'ws'
import WebSocketServer from './node_modules/ws/lib/websocket-server.js'
const WebSocket = { Server: WebSocketServer }
import dgram from 'dgram'

let wsClients = []
const wsServer = new WebSocket.Server({
  host: process.env.WS_HOST || '::',
  port: process.env.WS_PORT || '1458'
})
wsServer.on('listening', () => {
  const { host, port } = wsServer.options
  console.log('listening', host, port)
})

wsServer.on('connection', (client, req) => {
  client.authenticated = false
  client.on('error', onclose)
  client.on('close', onclose)
  client.on('message', onmessage)
  wsClients.push(client)
  console.log('connect', req.socket.remoteAddress)
  function onmessage (evt) {
    if (client.authenticated) {
      udpSocket.send(evt, process.env.UDP_PORT || '1457', process.env.UDP_HOST || '127.0.0.1')
    } else if (evt.indexOf('rw:') === 0) {
      const psk = evt.slice(3).toString()
      if (psk === (process.env.PRE_SHARED_KEY || 'secret')) {
        client.authenticated = true
        client.send('ack')
        console.log('auth', req.socket.remoteAddress)
      } else {
        client.authenticated = false
        client.send('nack')
        console.log('auth failed', req.socket.remoteAddress)
      }
    } else if (evt === 'ro') {
      client.readonly = true
    }
  }
  function onclose (err) {
    client.authenticated = false
    client.removeListener('error', onclose)
    client.removeListener('close', onclose)
    client.removeListener('message', onmessage)
    wsClients = wsClients.filter(c => c !== client)
    if (err) {
      console.error('disconnect with error', err, req.socket.remoteAddress)
    } else {
      console.log('disconnect', req.socket.remoteAddress)
    }
  }
})

const udpSocket = dgram.createSocket(process.env.UDP_FAMILY || 'udp4')
udpSocket.bind(process.env.UDP_PORT || '1457')
udpSocket.on('message', message => {
  wsClients.forEach(c => {
    if (c.authenticated || c.readonly) {
      c.send(message.toString())
    }
  })
})
