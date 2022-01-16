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
  client.id = req.socket.remotePort
  client.authenticated = false
  client.on('error', onclose)
  client.on('close', onclose)
  client.on('message', onmessage)
  wsClients.push(client)
  console.log('connect', client.id)
  function onmessage (message) {
    if (client.authenticated) {
      udpSendSocket.send(message, process.env.UDP_PORT_SEND || '1457', udpSendHost)
    } else {
      if (message.toString() === (process.env.PRE_SHARED_KEY || 'secret')) {
        client.authenticated = true
        client.send('ok')
        console.log('auth', client.id)
      } else {
        client.authenticated = false
        client.send('not ok')
        console.log('auth failed', client.id)
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
      console.error('disconnect with error', err, client.id)
    } else {
      console.log('disconnect', client.id)
    }
  }
})

const udpSendHost = process.env.UDP_SEND_HOST || '127.0.0.1'
const udpSendSocket = dgram.createSocket(udpSendHost.indexOf(':') !== -1 ? 'udp6' : 'udp4')

const udpRecvHost = process.env.UDP_RECV_HOST || '255.255.255.255'
const udpRecvSocket = dgram.createSocket(udpRecvHost.indexOf(':') !== -1 ? 'udp6' : 'udp4')
udpRecvSocket.bind(process.env.UDP_RECV_PORT || '1457', udpRecvHost)
udpRecvSocket.on('message', message => {
  wsClients.forEach(c => {
    if (c.authenticated) {
      c.send(message.toString())
      // console.log('sent data to', c.id)
    }
  })
})
