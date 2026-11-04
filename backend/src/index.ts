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

wss.on("connection", (ws) => {
  const id = generateRandomId();

  const initialData = getInitialData();
  clients.set(id, { id, socket: ws });
  ws.send(JSON.stringify({ type: "connected", id: id, initialData }));
  console.log("New client connected", id);

  ws.on("message", function (data) {
    console.log(`Message from ${id} -> %s`, data);
    const d = JSON.parse(data.toString());

    if (d.type === "join") {
      const roomUsers = [
        ...clients.values().filter((user) => user.room === room),
      ];

      if (roomUsers.length >= MAX_ROOM_SIZE)
        return ws.send(
          JSON.stringify({
            type: "error",
            message: "Room is full",
          }),
        );
      const room = d.room;
      const name = d.name;

      const currentUser = clients.get(id);

      if (!currentUser) return;
      currentUser.room = room;
      currentUser.name = name;
      clients.set(id, currentUser);

      [...clients.values()].forEach((client) => {
        if (client.id !== id) {
          client.socket.send(
            JSON.stringify({
              type: "update",
              message: `${name} joined the room`,
            }),
          );
        } else {
          client.socket.send(JSON.stringify({ status: "success", room }));
        }
      });
    }

    if (d.type === "message") {
      const roomId = clients.get(id)?.room;

      if (!roomId) {
        return ws.send(
          JSON.stringify({
            type: "error",
            message: "Join a room first",
          }),
        );
      }

      [...clients.values()].forEach((client) => {
        if (client.room === roomId)
          if (client.socket.readyState === WebSocket.OPEN)
            client.socket.send(
              JSON.stringify({
                type: "message",
                id: id,
                message: data.toString(),
              }),
            );
      });
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log("Client Disconnected", id);
  });
});
