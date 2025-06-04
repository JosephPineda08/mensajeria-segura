const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const server = http.createServer(); // 💡 Necesario para compatibilidad con Render

const wss = new WebSocket.Server({ server });

const clients = new Map(); // nombre -> { ws, publicKey }

console.log('🚀 Servidor de señalización iniciado');

wss.on('connection', (ws) => {
  console.log('📡 Cliente conectado');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'register') {
        const { name, publicKey } = message;
        clients.set(name, { ws, publicKey });
        console.log(`✅ Usuario registrado: ${name}`);
        return;
      }

      if (message.type === 'get-public-key') {
        const { target } = message;
        if (clients.has(target)) {
          const targetInfo = clients.get(target);
          ws.send(JSON.stringify({
            type: 'public-key',
            name: target,
            publicKey: targetInfo.publicKey
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: `El usuario ${target} no está conectado`
          }));
        }
        return;
      }

      if (message.type === 'message') {
        const { to, payload } = message;
        const recipient = clients.get(to);
        if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
          recipient.ws.send(JSON.stringify({
            type: 'message',
            from: message.from,
            payload
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: `No se pudo enviar el mensaje a ${to}`
          }));
        }
        return;
      }

    } catch (err) {
      console.error('❌ Error al procesar mensaje:', err.message);
    }
  });

  ws.on('close', () => {
    for (const [name, client] of clients.entries()) {
      if (client.ws === ws) {
        clients.delete(name);
        console.log(`🔌 Usuario desconectado: ${name}`);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
});
