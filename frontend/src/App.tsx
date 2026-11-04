import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

function App() {
  const socket = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[] | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    socket.current = ws;

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "message") {
        setMessages((pd) => [...(pd || []), data]);
      }

      if (data.type === "connected") setMyId(data.id);
    };

    return () => {
      ws.close();
      socket.current = null;
    };
  }, []);

  console.log(messages);
  return (
    <div className="w-full h-screen">
      <Outlet/>
    </div>
  );
}

export default App;
