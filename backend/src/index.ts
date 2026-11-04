import WebSocket, { WebSocketServer } from "ws";
import { generateRandomId } from "./libs/crypto.js";

const wss = new WebSocketServer({ port: 8080 });

interface IUser {
  id: string;
  name?: string;
  socket: WebSocket;
  room?: string;
}

interface IRoom {
  room: string;
  userJoined: number;
  roomSize: number;
}

const MAX_ROOM_SIZE = 5;
const clients = new Map<string, IUser>();

function getInitialData() {
  const initialData = [...clients.values()].reduce(
    (acc, user) => {
      if (!user.room) return acc;

      if (!acc[user.room]) {
        acc[user.room] = {
          room: user.room,
          userJoined: 0,
          roomSize: MAX_ROOM_SIZE,
        };
      }

      acc[user.room]!.userJoined++;

      return acc;
    },
    {} as Record<string, IRoom>,
  );

  const rooms = Object.values(initialData);

  return {
    totalRooms: rooms.length,
    rooms,
  };
}

function send(socket: WebSocket, data: object) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}

function broadcast(roomId: string, data: object) {
  clients.forEach((client) => {
    if (client.room === roomId && client.socket.readyState === WebSocket.OPEN)
      send(client.socket, data);
  });
}

wss.on("connection", (ws) => {
  const id = generateRandomId();

  clients.set(id, { id, socket: ws });

  send(ws, { type: "connected", id, initialData: getInitialData() });

  console.log("New client connected", id);

  ws.on("message", function (data) {
    let d: any;

    try {
      d = JSON.parse(data.toString());
    } catch (error) {
      return send(ws, {
        type: "error",
        message: "Invalid JSON",
      });
    }

    const currentUser = clients.get(id);
    if (!currentUser) return;

    if (d.type === "join") {
      const room = d.room;
      const name = d.name;

      if (typeof name !== "string" || !name.trim()) {
        return send(ws, {
          type: "error",
          message: "Invalid username",
        });
      }

      if (typeof name !== "string" || !name.trim() || name.trim().length > 20) {
        return send(ws, {
          type: "error",
          message: "Invalid username",
        });
      }

      const roomUsers = [...clients.values()].filter(
        (user) => user.room === room,
      );

      if (currentUser.room !== room && roomUsers.length >= MAX_ROOM_SIZE) {
        return send(ws, {
          type: "error",
          message: "Room is full",
        });
      }

      currentUser.room = room;
      currentUser.name = name.trim();
      clients.set(id, currentUser);

      const initialData = getInitialData();

      send(ws, {
        type: "joined",
        room,
        initialData,
      });

      clients.forEach((client) => {
        send(client.socket, {
          type: "room-update",
          initialData,
        });
      });
    } else if (d.type === "message") {
      const roomId = currentUser.room;

      if (!roomId) {
        return send(ws, {
          type: "error",
          message: "Join a room first",
        });
      }

      if (
        typeof d.message !== "string" ||
        !d.message.trim() ||
        d.message.length > 2000
      ) {
        return send(ws, {
          type: "error",
          message: "Invalid message",
        });
      }

      broadcast(roomId, {
        type: "message",
        id,
        name: currentUser.name,
        message: d.message.trim(),
      });
    } else {
      send(ws, {
        type: "error",
        message: "Unknown event type",
      });
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log("Client Disconnected", id);

    const initialData = getInitialData();
    clients.forEach((client) => {
      send(client.socket, {
        type: "room-update",
        initialData,
      });
    });
  });
});
