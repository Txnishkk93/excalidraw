"use client";

import { useCanvasStore, ToolType } from "@/store/canvas-store";
import { MousePointer2, Hand, Square, Diamond, Circle, MoveRight, Minus, Pencil, Type, Eraser } from "lucide-react";
import clsx from "clsx";

const tools: { id: ToolType; icon: React.FC<any>; label: string; shortcut: string }[] = [
  { id: "selection", icon: MousePointer2, label: "Selection", shortcut: "V" },
  { id: "hand", icon: Hand, label: "Pan", shortcut: "H" },
  { id: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "diamond", icon: Diamond, label: "Diamond", shortcut: "D" },
  { id: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  { id: "arrow", icon: MoveRight, label: "Arrow", shortcut: "A" },
  { id: "line", icon: Minus, label: "Line", shortcut: "L" },
  { id: "pencil", icon: Pencil, label: "Draw", shortcut: "P" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

export default function CanvasToolbar() {
  const { activeTool, setActiveTool } = useCanvasStore();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 radius-pill border border-[var(--border-color)] bg-[var(--bg-color)] p-1.5 shadow-sm">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={clsx(
              "flex h-9 w-9 items-center justify-center radius-pill transition-colors",
              isActive 
                ? "bg-[var(--color-nova-ink-soft)] text-white" 
                : "text-[var(--text-color)] hover:bg-[var(--bg-soft)]"
            )}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}
