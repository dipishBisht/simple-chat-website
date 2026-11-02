import WebSocket, { WebSocketServer } from "ws";
import { generateRandomId } from "./libs/crypto.js";

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map<string, WebSocket>();

wss.on("connection", (ws) => {
  const id = generateRandomId();

  ws.send(JSON.stringify({ type: "connected", id: id }));

  clients.set(id, ws);
  console.log("New client connected", id);
  ws.on("message", function (data) {
    console.log(`Message from ${id} -> %s`, data);

    wss.clients.forEach((client) => {
      // if (client !== ws && client.readyState === WebSocket.OPEN)
      client.send(
        JSON.stringify({ type: "message", id: id, message: data.toString() }),
      );
    });
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log("Client Disconnected", id);
  });
});
