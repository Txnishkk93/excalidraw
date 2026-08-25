import { WebSocketServer, WebSocket } from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config.js";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws, request) => {
    const url = request.url;
    if (!url) {
        return;
    }
    const queryParam = new URLSearchParams(url.split('?')[1]);
    const token = queryParam.get('token') || "";
    const decoded = jwt.verify(token, JWT_SECRET as string);

    if (typeof decoded === "string") {
        ws.close();
        return;
    }

    if (!decoded || !(decoded as JwtPayload).userId) {
        ws.close();
        return;
    }
    ws.on("message", (data) => {
        ws.send('something');
    });
});