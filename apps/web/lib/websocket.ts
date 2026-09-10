const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

type MessageHandler = (data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  public connect(roomId: number) {
    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;

    const token = localStorage.getItem("token");
    if (!token) {
      this.isConnecting = false;
      return;
    }

    this.ws = new WebSocket(`${WS_URL}?token=${token}`);

    this.ws.onopen = () => {
      this.isConnecting = false;
      console.log("WebSocket connected");
      this.send({ type: "join_room", roomId });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handlers.forEach((handler) => handler(data));
      } catch (err) {
        console.error("Invalid WS message", err);
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.ws = null;
      console.log("WebSocket disconnected. Reconnecting...");
      this.reconnectTimeout = setTimeout(() => this.connect(roomId), 3000);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error", err);
      this.ws?.close();
    };
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

export const wsManager = new WebSocketManager();
