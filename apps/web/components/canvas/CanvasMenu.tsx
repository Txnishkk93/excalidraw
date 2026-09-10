"use client";

import { useCanvasStore } from "@/store/canvas-store";
import { Menu, Undo2, Redo2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CanvasMenu({ roomId }: { roomId: number }) {
  const { undo, redo } = useCanvasStore();
  const router = useRouter();

  return (
    <div className="absolute top-4 left-4 flex items-center gap-2">
      <button 
        className="flex h-10 items-center justify-center gap-2 radius-container border border-[var(--border-color)] bg-[var(--bg-color)] px-3 shadow-sm hover:bg-[var(--bg-soft)] transition-colors"
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center radius-container border border-[var(--border-color)] bg-[var(--bg-color)] p-1 shadow-sm">
        <button 
          onClick={undo}
          className="flex h-8 w-8 items-center justify-center radius-container hover:bg-[var(--bg-soft)] transition-colors text-[var(--text-color)]"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button 
          onClick={redo}
          className="flex h-8 w-8 items-center justify-center radius-container hover:bg-[var(--bg-soft)] transition-colors text-[var(--text-color)]"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <button 
        onClick={() => router.push("/dashboard")}
        className="flex h-10 items-center justify-center gap-2 radius-container border border-[var(--border-color)] bg-[var(--bg-color)] px-4 shadow-sm hover:bg-[var(--bg-soft)] transition-colors text-sm font-medium"
      >
        Dashboard
      </button>
    </div>
  );
}
