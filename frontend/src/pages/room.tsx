import { useState } from "react";

export default function RoomPage(){

      const [myId, setMyId] = useState<string | null>(null);
      const [input, setInput] = useState("");

    function sendMessage() {
    if (!input.trim()) return alert("Please enter a message");

    if (!socket.current || socket.current.readyState !== WebSocket.OPEN)
      return alert("WebSocket is not connected");

    socket.current.send(input);
    setInput("");
  }

    return (
        <div className="border max-w-md h-full mx-auto flex flex-col w-full items-end pb-8">
        <div className="h-full w-full border px-2 pt-5">
          {messages &&
            messages.map(({ id, message }) => (
              <div
                className={`${id === myId ? "text-right" : ""}`}
                key={id + message}
              >
                {message}
              </div>
            ))}
        </div>
        <div className="flex items-center justify-center w-full h-10">
          <input
            className="w-4/5 h-full border px-2"
            type="text"
            placeholder="Type ...."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="border w-1/5 h-full bg-purple-600 text-white border-transparent cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    )
}