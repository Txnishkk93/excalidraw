"use client";

import { useCanvasStore } from "@/store/canvas-store";
import { wsManager } from "@/lib/websocket";

const COLORS = [
  "transparent",
  "#ffffff",
  "#000000",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#9c36b5"
];

const STROKE_WIDTHS = [1, 2, 4, 8];

export default function PropertiesPanel({ roomId }: { roomId: number }) {
  const { 
    selectedElementIds, 
    elements, 
    updateElement,
    defaultStrokeColor,
    defaultBackgroundColor,
    defaultStrokeWidth,
    setDefaultProperties
  } = useCanvasStore();

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  
  const handleColorChange = (property: 'strokeColor' | 'backgroundColor', color: string) => {
    if (selectedElements.length > 0) {
      selectedElements.forEach(el => {
        updateElement(el.id, { [property]: color });
        wsManager.send({ type: "element_update", roomId, element: { ...el, [property]: color } });
      });
    } else {
      setDefaultProperties({ [property === 'strokeColor' ? 'defaultStrokeColor' : 'defaultBackgroundColor']: color });
    }
  };

  const handleWidthChange = (width: number) => {
    if (selectedElements.length > 0) {
      selectedElements.forEach(el => {
        updateElement(el.id, { strokeWidth: width });
        wsManager.send({ type: "element_update", roomId, element: { ...el, strokeWidth: width } });
      });
    } else {
      setDefaultProperties({ defaultStrokeWidth: width });
    }
  };

  const currentStrokeColor = selectedElements.length > 0 ? selectedElements[0].strokeColor : defaultStrokeColor;
  const currentBackgroundColor = selectedElements.length > 0 ? selectedElements[0].backgroundColor : defaultBackgroundColor;
  const currentStrokeWidth = selectedElements.length > 0 ? selectedElements[0].strokeWidth : defaultStrokeWidth;

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-48 flex flex-col gap-4 z-50">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Stroke</h4>
        <div className="flex flex-wrap gap-1">
          {COLORS.map(color => (
            <button
              key={`stroke-${color}`}
              className={`w-6 h-6 rounded-md border ${currentStrokeColor === color ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}
              style={{ backgroundColor: color === 'transparent' ? '#f8f9fa' : color, backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none', backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' }}
              onClick={() => handleColorChange('strokeColor', color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Background</h4>
        <div className="flex flex-wrap gap-1">
          {COLORS.map(color => (
            <button
              key={`bg-${color}`}
              className={`w-6 h-6 rounded-md border ${currentBackgroundColor === color ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}
              style={{ backgroundColor: color === 'transparent' ? '#f8f9fa' : color, backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none', backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' }}
              onClick={() => handleColorChange('backgroundColor', color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Stroke Width</h4>
        <div className="flex gap-2">
          {STROKE_WIDTHS.map(width => (
            <button
              key={`width-${width}`}
              className={`flex-1 h-8 rounded-md border flex items-center justify-center ${currentStrokeWidth === width ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              onClick={() => handleWidthChange(width)}
            >
              <div className="bg-gray-800 rounded-full" style={{ height: width, width: 16 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
