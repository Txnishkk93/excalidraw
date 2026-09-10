import { create } from "zustand";

export type ToolType = "selection" | "hand" | "rectangle" | "diamond" | "ellipse" | "arrow" | "line" | "pencil" | "text" | "eraser";

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: [number, number][]; // For lines, arrows, pencil
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  rotation: number;
  zIndex: number;
}

export interface ChatMessage {
  userId: number;
  message: string;
  timestamp: number;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedElementIds: string[];
  activeTool: ToolType;
  zoom: number;
  pan: { x: number; y: number };
  canvasBackground: string;
  history: CanvasElement[][];
  redoStack: CanvasElement[][];
  gridEnabled: boolean;
  snapEnabled: boolean;
  zenMode: boolean;
  viewMode: boolean;
  collaborators: any[];
  collaboratorCursors: Record<number, { x: number; y: number; lastUpdated: number }>;
  chatMessages: ChatMessage[];
  
  defaultStrokeColor: string;
  defaultBackgroundColor: string;
  defaultStrokeWidth: number;
  defaultOpacity: number;

  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  
  setCollaboratorCursor: (userId: number, x: number, y: number) => void;
  removeCollaboratorCursor: (userId: number) => void;
  
  addChatMessage: (msg: ChatMessage) => void;

  setActiveTool: (tool: ToolType) => void;
  setSelectedElementIds: (ids: string[]) => void;
  
  setDefaultProperties: (props: Partial<Pick<CanvasState, "defaultStrokeColor" | "defaultBackgroundColor" | "defaultStrokeWidth" | "defaultOpacity">>) => void;
  
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  
  setCanvasBackground: (bg: string) => void;
  
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  setGridEnabled: (enabled: boolean) => void;
  setZenMode: (enabled: boolean) => void;
  setViewMode: (enabled: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedElementIds: [],
  activeTool: "selection",
  zoom: 1,
  pan: { x: 0, y: 0 },
  canvasBackground: "#ffffff",
  history: [[]],
  redoStack: [],
  gridEnabled: false,
  snapEnabled: false,
  zenMode: false,
  viewMode: false,
  collaborators: [],
  collaboratorCursors: {},
  chatMessages: [],
  
  defaultStrokeColor: "var(--color-nova-ink)",
  defaultBackgroundColor: "transparent",
  defaultStrokeWidth: 2,
  defaultOpacity: 1,

  setElements: (elements) => set({ elements }),
  
  addElement: (element) => {
    get().pushHistory();
    set((state) => ({ elements: [...state.elements, element] }));
  },
  
  updateElement: (id, updates) => {
    get().pushHistory();
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    }));
  },
  
  deleteElement: (id) => {
    get().pushHistory();
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementIds: state.selectedElementIds.filter((selId) => selId !== id),
    }));
  },

  setCollaboratorCursor: (userId, x, y) => set((state) => ({
    collaboratorCursors: {
      ...state.collaboratorCursors,
      [userId]: { x, y, lastUpdated: Date.now() },
    }
  })),

  removeCollaboratorCursor: (userId) => set((state) => {
    const newCursors = { ...state.collaboratorCursors };
    delete newCursors[userId];
    return { collaboratorCursors: newCursors };
  }),

  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
  
  setDefaultProperties: (props) => set((state) => ({ ...state, ...props })),
  
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setCanvasBackground: (bg) => set({ canvasBackground: bg }),

  pushHistory: () => {
    set((state) => {
      const currentElements = JSON.parse(JSON.stringify(state.elements));
      return {
        history: [...state.history, currentElements].slice(-50), // keep last 50 states
        redoStack: [],
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length <= 1) return state;
      const previousState = state.history[state.history.length - 2];
      const currentState = state.history[state.history.length - 1];
      
      return {
        elements: previousState,
        history: state.history.slice(0, -1),
        redoStack: [...state.redoStack, currentState],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.redoStack.length === 0) return state;
      const nextState = state.redoStack[state.redoStack.length - 1];
      
      return {
        elements: nextState,
        history: [...state.history, nextState],
        redoStack: state.redoStack.slice(0, -1),
      };
    });
  },

  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
  setZenMode: (enabled) => set({ zenMode: enabled }),
  setViewMode: (enabled) => set({ viewMode: enabled }),
}));
