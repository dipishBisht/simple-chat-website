import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface IMessage {
  type: "message";
  id: string;
  message: string;
}

interface IRoom {
  room: string;
  userJoined: number;
  roomSize: number;
}

interface ISocketContext {
  myId: string | null;
  messages: IMessage[];
  rooms: IRoom[];
  totalRooms: number;
  isConnected: boolean;
  joinRoom: (room: string) => void;
  sendMessage: (message: string) => void;
}

const SocketContext = createContext<ISocketContext | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useRef<WebSocket | null>(null);

  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    socket.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to server");
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "connected") {
        setMyId(data.id);

        if (data.initialData) {
          setRooms(data.initialData.rooms);
          setTotalRooms(data.initialData.totalRooms);
        }
      }

      if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
      }

      if (data.type === "room-update" || data.type === "joined") {
        const initialData = data.initialData;

        if (initialData) {
          setRooms(initialData.rooms);
          setTotalRooms(initialData.totalRooms);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socket.current = null;
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    return () => {
      ws.close();
      socket.current = null;
    };
  }, []);

  function joinRoom(room: string) {
    if (socket.current?.readyState !== WebSocket.OPEN) return;

    socket.current.send(
      JSON.stringify({
        type: "join",
        room,
      }),
    );
  }

  function sendMessage(message: string) {
    if (!message.trim()) return;

    if (socket.current?.readyState !== WebSocket.OPEN) return;

    socket.current.send(
      JSON.stringify({
        type: "message",
        message,
      }),
    );
  }

  return (
    <SocketContext.Provider
      value={{
        myId,
        isConnected,
        joinRoom,
        messages,
        rooms,
        sendMessage,
        totalRooms,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

// export function useSocket(){
//   const 
// }
