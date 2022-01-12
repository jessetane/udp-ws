// import WebSocket from 'ws' // TODO this doesn't work for some reason
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
  function onmessage (message) {
    if (client.authenticated) {
      udpSocketSend.send(message, process.env.UDP_PORT_SEND || '1457', udpHostSend)
    } else {
      if (message.toString() === (process.env.PRE_SHARED_KEY || 'secret')) {
        client.authenticated = true
        client.send('ok')
        console.log('auth', req.socket.remoteAddress)
      } else {
        client.authenticated = false
        client.send('not ok')
        console.log('auth failed', req.socket.remoteAddress)
      }
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

const udpHostSend = process.env.UDP_HOST_SEND || '127.0.0.1'
const udpSocketSend = dgram.createSocket(udpHostSend.indexOf(':') !== -1 ? 'udp6' : 'udp4')

const udpHostRecv = process.env.UDP_HOST_RECV || '255.255.255.255'
const udpSocketRecv = dgram.createSocket(udpHostRecv.indexOf(':') !== -1 ? 'udp6' : 'udp4')
udpSocketRecv.bind(process.env.UDP_PORT_RECV || '1457', udpHostRecv)
udpSocketRecv.on('message', message => {
  wsClients.forEach(c => {
    if (c.authenticated) {
      c.send(message.toString())
    }
  })
})
