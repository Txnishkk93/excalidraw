"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { wsManager } from "@/lib/websocket";
import { useCanvasStore } from "@/store/canvas-store";
import CanvasRenderer from "./CanvasRenderer";
import CanvasToolbar from "./CanvasToolbar";
import CanvasMenu from "./CanvasMenu";
import ChatPanel from "./ChatPanel";
import PropertiesPanel from "./PropertiesPanel";

export default function CanvasClient({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const { setElements, setCanvasBackground } = useCanvasStore();

  useEffect(() => {
    const initCanvas = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signin");
        return;
      }

      try {
        const data = await apiFetch(`/api/v1/rooms/${roomId}`);
        
        if (data.room.elements) {
          const loadedElements = data.room.elements.map((el: any) => el.data);
          setElements(loadedElements);
        }
        if (data.room.backgroundColor) {
          setCanvasBackground(data.room.backgroundColor);
        }

        wsManager.connect(Number(roomId));
        
        const unsubscribe = wsManager.subscribe((msg: any) => {
          if (msg.type === "element_create" || msg.type === "element_update") {
            const { setElements, elements } = useCanvasStore.getState();
            // In a real app we'd merge cleanly or use a map
            const existingIdx = elements.findIndex(e => e.id === msg.element.id);
            if (existingIdx > -1) {
              const newEls = [...elements];
              newEls[existingIdx] = msg.element;
              setElements(newEls);
            } else {
              setElements([...elements, msg.element]);
            }
          }
          if (msg.type === "element_delete") {
            const { setElements, elements } = useCanvasStore.getState();
            setElements(elements.filter(e => e.id !== msg.elementId));
          }
          if (msg.type === "canvas_update") {
            setCanvasBackground(msg.backgroundColor);
          }
          if (msg.type === "cursor_move") {
            const { setCollaboratorCursor } = useCanvasStore.getState();
            setCollaboratorCursor(msg.userId, msg.x, msg.y);
          }
          if (msg.type === "chat") {
            const { addChatMessage } = useCanvasStore.getState();
            addChatMessage({ userId: msg.userId, message: msg.message, timestamp: Date.now() });
          }
        });

        setLoading(false);

        return () => {
          unsubscribe();
          wsManager.disconnect();
        };

      } catch (err) {
        console.error(err);
        router.push("/dashboard");
      }
    };

    initCanvas();
  }, [roomId, router, setElements, setCanvasBackground]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">Loading canvas...</div>;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--bg-color)]">
      <CanvasRenderer roomId={Number(roomId)} />
      <CanvasMenu roomId={Number(roomId)} />
      <CanvasToolbar />
      <PropertiesPanel roomId={Number(roomId)} />
      <ChatPanel roomId={Number(roomId)} />
    </div>
  );
}
