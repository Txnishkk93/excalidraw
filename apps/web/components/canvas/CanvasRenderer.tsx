"use client";

import { useRef, useState, useEffect } from "react";
import { useCanvasStore, CanvasElement } from "@/store/canvas-store";
import { wsManager } from "@/lib/websocket";

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function CanvasRenderer({ roomId }: { roomId: number }) {
  const { 
    elements, activeTool, zoom, pan, canvasBackground,
    addElement, updateElement, selectedElementIds, setSelectedElementIds,
    collaboratorCursors,
    defaultStrokeColor, defaultBackgroundColor, defaultStrokeWidth, defaultOpacity
  } = useCanvasStore();
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(null);
  
  // Selection and Dragging State
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [resizeInitialState, setResizeInitialState] = useState<{x: number, y: number, width: number, height: number} | null>(null);

  const getPointerPos = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const { x, y } = getPointerPos(e);

    // If clicking on SVG background (not an element) in selection mode
    if (activeTool === "selection") {
      if (e.target === svgRef.current) {
        setSelectedElementIds([]);
      }
      return;
    }

    if (activeTool === "hand") return;
    
    const newElement: CanvasElement = {
      id: generateId(),
      type: activeTool,
      x, y,
      width: 0, height: 0,
      strokeColor: defaultStrokeColor,
      backgroundColor: defaultBackgroundColor,
      strokeWidth: defaultStrokeWidth,
      opacity: defaultOpacity,
      rotation: 0,
      zIndex: elements.length,
      points: [[0, 0]]
    };
    
    setCurrentElement(newElement);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Broadcast cursor position
    wsManager.send({ type: "cursor_move", roomId, x: e.clientX, y: e.clientY });

    const { x, y } = getPointerPos(e);

    if (resizingHandle && draggingElementId && resizeInitialState) {
      const el = elements.find(e => e.id === draggingElementId);
      if (!el) return;
      
      let newX = el.x;
      let newY = el.y;
      let newWidth = el.width;
      let newHeight = el.height;
      
      if (resizingHandle.includes('w')) {
        newX = Math.min(resizeInitialState.x + resizeInitialState.width, x);
        newWidth = resizeInitialState.x + resizeInitialState.width - newX;
      }
      if (resizingHandle.includes('e')) {
        newWidth = Math.max(0, x - resizeInitialState.x);
      }
      if (resizingHandle.includes('n')) {
        newY = Math.min(resizeInitialState.y + resizeInitialState.height, y);
        newHeight = resizeInitialState.y + resizeInitialState.height - newY;
      }
      if (resizingHandle.includes('s')) {
        newHeight = Math.max(0, y - resizeInitialState.y);
      }
      
      updateElement(el.id, { x: newX, y: newY, width: newWidth, height: newHeight });
      wsManager.send({ type: "element_update", roomId, element: { ...el, x: newX, y: newY, width: newWidth, height: newHeight } });
      return;
    }

    if (draggingElementId && !resizingHandle) {
       const el = elements.find(e => e.id === draggingElementId);
       if (el) {
          const newX = x - dragOffset.x;
          const newY = y - dragOffset.y;
          updateElement(el.id, { x: newX, y: newY });
          wsManager.send({ type: "element_update", roomId, element: { ...el, x: newX, y: newY } });
       }
       return;
    }

    if (!isDrawing || !currentElement) return;
    
    let updates: Partial<CanvasElement> = {};
    
    if (activeTool === "rectangle" || activeTool === "ellipse" || activeTool === "diamond") {
      updates = {
        width: x - currentElement.x,
        height: y - currentElement.y,
      };
    } else if (activeTool === "pencil" || activeTool === "line" || activeTool === "arrow") {
      const newPoints = [...(currentElement.points || []), [x - currentElement.x, y - currentElement.y]] as [number, number][];
      updates = { points: newPoints };
    }
    
    setCurrentElement({ ...currentElement, ...updates });
  };

  const handlePointerUp = () => {
    setDraggingElementId(null);
    setResizingHandle(null);
    setResizeInitialState(null);

    if (!isDrawing || !currentElement) return;
    
    // Normalize negative widths/heights for rects/ellipses
    const finalElement = { ...currentElement };
    if (finalElement.width < 0) {
      finalElement.x += finalElement.width;
      finalElement.width = Math.abs(finalElement.width);
    }
    if (finalElement.height < 0) {
      finalElement.y += finalElement.height;
      finalElement.height = Math.abs(finalElement.height);
    }

    addElement(finalElement);
    wsManager.send({ type: "element_create", roomId, element: finalElement });
    
    setIsDrawing(false);
    setCurrentElement(null);
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (activeTool === "selection") {
      e.stopPropagation();
      setSelectedElementIds([el.id]);
      const { x, y } = getPointerPos(e);
      setDraggingElementId(el.id);
      setDragOffset({ x: x - el.x, y: y - el.y });
    }
  };

  const renderBoundingBox = (el: CanvasElement) => {
    if (!selectedElementIds.includes(el.id)) return null;

    const pad = 5;
    let minX = el.x, minY = el.y, maxX = el.x + el.width, maxY = el.y + el.height;
    
    if (el.type === "line" || el.type === "arrow" || el.type === "pencil") {
      if (el.points && el.points.length > 0) {
          minX = el.x + Math.min(0, ...el.points.map(p => p[0]));
          minY = el.y + Math.min(0, ...el.points.map(p => p[1]));
          maxX = el.x + Math.max(0, ...el.points.map(p => p[0]));
          maxY = el.y + Math.max(0, ...el.points.map(p => p[1]));
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;

    const handles = [
      { id: 'nw', x: minX - pad, y: minY - pad },
      { id: 'ne', x: minX + width + pad, y: minY - pad },
      { id: 'sw', x: minX - pad, y: minY + height + pad },
      { id: 'se', x: minX + width + pad, y: minY + height + pad }
    ];

    return (
      <g>
        <rect 
          x={minX - pad} y={minY - pad} width={width + 2*pad} height={height + 2*pad} 
          fill="none" stroke="#6965db" strokeWidth="1" strokeDasharray="5,5" 
        />
        {handles.map(h => (
          <rect 
            key={h.id} x={h.x - 4} y={h.y - 4} 
            width={8} height={8} fill="#fff" stroke="#6965db" strokeWidth="1"
            style={{ cursor: `${h.id}-resize` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setResizingHandle(h.id);
              setDraggingElementId(el.id);
              setResizeInitialState({ x: el.x, y: el.y, width: el.width, height: el.height });
            }}
          />
        ))}
      </g>
    );
  };

  const renderShape = (el: CanvasElement) => {
    const props = {
      stroke: el.strokeColor,
      strokeWidth: el.strokeWidth,
      fill: el.backgroundColor,
      opacity: el.opacity,
    };

    switch (el.type) {
      case "rectangle":
        return <rect x={el.x} y={el.y} width={el.width} height={el.height} {...props} />;
      case "ellipse":
        return <ellipse cx={el.x + el.width/2} cy={el.y + el.height/2} rx={Math.abs(el.width/2)} ry={Math.abs(el.height/2)} {...props} />;
      case "diamond":
        const pts = `${el.x + el.width/2},${el.y} ${el.x + el.width},${el.y + el.height/2} ${el.x + el.width/2},${el.y + el.height} ${el.x},${el.y + el.height/2}`;
        return <polygon points={pts} {...props} />;
      case "line":
      case "arrow":
      case "pencil":
        if (!el.points || el.points.length === 0) return null;
        const pathData = `M ${el.x} ${el.y} ` + el.points.map(p => `L ${el.x + p[0]} ${el.y + p[1]}`).join(" ");
        return <path d={pathData} {...props} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
      default:
        return null;
    }
  };

  return (
    <svg
      ref={svgRef}
      className="h-full w-full touch-none"
      style={{ backgroundColor: canvasBackground, cursor: activeTool === "selection" ? "default" : "crosshair" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {elements.map((el) => (
          <g 
            key={el.id} 
            className={activeTool === "selection" ? "cursor-move" : ""} 
            onPointerDown={(e) => handleElementPointerDown(e, el)}
          >
            {renderShape(el)}
            {renderBoundingBox(el)}
          </g>
        ))}
        {currentElement && <g className="opacity-70 pointer-events-none">{renderShape(currentElement)}</g>}
        
        {Object.entries(collaboratorCursors).map(([userId, cursor]) => {
          if (Date.now() - cursor.lastUpdated > 10000) return null; // hide after 10s
          return (
            <g key={userId} transform={`translate(${cursor.x}, ${cursor.y})`} className="pointer-events-none">
              <path
                d="M 0 0 L 11.3 11.3 L 6.5 11.3 L 4.8 17.5 L 2 17.5 L 3.5 11.3 L 0 11.3 Z"
                fill="#ff00ff"
                stroke="#ffffff"
                strokeWidth="1"
              />
              <rect x="12" y="12" width="60" height="20" rx="4" fill="#ff00ff" />
              <text x="16" y="26" fontSize="12" fill="white" fontWeight="bold">
                User {userId}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
