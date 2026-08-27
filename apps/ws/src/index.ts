import { parse } from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config.js";
import { prismaClient } from "@repo/db/client";

const prisma=prismaClient;
const wss = new WebSocketServer({ port: 8080 });
interface User {
    socket: WebSocket,
    roomId: string
}

const allScoket: User[] = [];

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

wss.on("connection", (socket) => {
    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.type === 'join') {
            allScoket.push({
                socket,
                roomId: parsedMessage.payload.roomId
            })
        }
        if (parsedMessage.type === 'chat') {
            let currentUserRoom = null;
            for (let i = 0; i < allScoket.length; i++) {
                currentUserRoom = allScoket[i];
                if (allScoket[i]?.socket == socket) {
                    currentUserRoom = allScoket[i]?.room
                }
            }
            for (let i = 0; i < allScoket.length; i++) {
                if (allScoket[i]?.room == currentUserRoom) {
                    allScoket[i]?.socket.send(parsedMessage);
                }
            }
        }
    });
})