const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

const server = http.createServer(); // ✅ necesario en Render
const wss = new WebSocket.Server({ server });

const clients = new Map(); // name -> { ws, publicKey }

function broadcastUserList() {
  const users = Array.from(clients.keys());
  const message = JSON.stringify({ type: 'user-list', users });
  for (const client of clients.values()) {
    client.ws.send(message);
  }
}

wss.on('connection', (ws) => {
  console.log('🟢 Cliente conectado');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'register') {
        clients.set(msg.name, { ws, publicKey: msg.publicKey });
        console.log(`✅ ${msg.name} registrado`);
        broadcastUserList();
        return;
      }

      if (msg.type === 'signal') {
        const target = clients.get(msg.to);
        if (target && target.ws.readyState === WebSocket.OPEN) {
          target.ws.send(JSON.stringify({
            type: 'signal',
            from: msg.from,
            data: msg.data
          }));
        }
        return;
      }
    } catch (err) {
      console.error('❌ Error al procesar mensaje:', err);
    }
  });

  ws.on('close', () => {
    for (const [name, client] of clients.entries()) {
      if (client.ws === ws) {
        clients.delete(name);
        console.log(`🔌 ${name} desconectado`);
        break;
      }
    }
    broadcastUserList();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
