// signaling-server/index.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('📡 Cliente conectado');

  ws.on('message', (message) => {
    // Reenvía a todos menos al que lo envió
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('❌ Cliente desconectado');
  });
});
