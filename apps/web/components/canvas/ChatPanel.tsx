"use client";

import { useState } from "react";
import { useCanvasStore } from "@/store/canvas-store";
import { wsManager } from "@/lib/websocket";

export default function ChatPanel({ roomId }: { roomId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { chatMessages } = useCanvasStore();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    wsManager.send({ type: "chat", roomId, message });
    setMessage("");
  };

  return (
    <div className={`absolute bottom-20 right-4 z-50 flex flex-col transition-all ${isOpen ? 'w-80 h-96' : 'w-auto h-auto'}`}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 self-end"
        >
          💬 Chat
        </button>
      ) : (
        <div className="flex flex-col bg-white rounded-lg shadow-xl h-full border border-gray-200">
          <div className="flex justify-between items-center p-3 border-b bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-700">Room Chat</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
              ✖
            </button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
            {chatMessages.length === 0 ? (
              <p className="text-gray-400 text-center text-sm mt-4">No messages yet.</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-gray-100 p-2 rounded-lg max-w-[85%] self-start">
                  <span className="text-xs text-blue-600 font-bold block mb-1">User {msg.userId}</span>
                  <span className="text-sm text-gray-800">{msg.message}</span>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSend} className="p-3 border-t flex gap-2 bg-white rounded-b-lg">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Type a message..."
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
