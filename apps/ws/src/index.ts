import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config.js";
import { prismaClient } from "@repo/db/client";

const prisma = prismaClient;
const wss = new WebSocketServer({ port: 8080 });
interface User {
    ws: WebSocket;
    rooms: number[];
    userId: number;
}

const users: User[] = [];
// const allScoket: User[] = [];

function checkUser(token: string): number | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string" || !decoded || typeof decoded.userId !== "number") {
            return null;
        }

        if (!Number.isInteger(decoded.userId)) {
            return null;
        }
        return decoded.userId;
    } catch (error) {
        return null;
    }
}

wss.on("connection", (ws, request) => {
    const url = request.url;
    if (!url) {
        return;
    }
    const queryParam = new URLSearchParams(url.split('?')[1]);
    const token = queryParam.get('token') || "";
    const userId = checkUser(token);

    if (userId == null) {
        ws.close();
        return null;
    }

    users.push({
        userId,
        rooms: [],
        ws
    })

    ws.on("message", async (data) => {
        let parsedData: { type?: string; roomId?: number | string; message?: string };
        try {
            parsedData = JSON.parse(data.toString());
        } catch {
            ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
            return;
        }

        const user = users.find((currentUser) => currentUser.ws === ws);
        if (!user) {
            return;
        }

        if (parsedData.type === "join_room") {
            const roomId = Number(parsedData.roomId);
            if (Number.isInteger(roomId) && !user.rooms.includes(roomId)) {
                user.rooms.push(roomId);
            }
        }

        if (parsedData.type === "leave_room") {
            const roomId = Number(parsedData.roomId);
            user.rooms = user.rooms.filter((joinedRoomId) => joinedRoomId !== roomId);
        }

        if (parsedData.type === "chat") {
            const roomId = Number(parsedData.roomId);
            const message = parsedData.message;
            if (!Number.isInteger(roomId) || typeof message !== "string") {
                return;
            }

            await prisma.chat.create({
                data: {
                    roomId,
                    message,
                    userId
                }
            });

            users.forEach((recipient) => {
                if (recipient.rooms.includes(roomId)) {
                    recipient.ws.send(JSON.stringify({
                        type: "chat",
                        message,
                        roomId
                    }));
                }
            });
        }
    });

    ws.on("close", () => {
        const userIndex = users.findIndex((currentUser) => currentUser.ws === ws);
        if (userIndex !== -1) {
            users.splice(userIndex, 1);
        }
    });
});

// wss.on("connection", (socket) => {
//     socket.on("message", (message) => {
//         const parsedMessage = JSON.parse(message.toString());
//         if (parsedMessage.type === 'join') {
//             allScoket.push({
//                 socket,
//                 roomId: parsedMessage.payload.roomId
//             })
//         }
//         if (parsedMessage.type === 'chat') {
//             let currentUserRoom = null;
//             for (let i = 0; i < allScoket.length; i++) {
//                 currentUserRoom = allScoket[i];
//                 if (allScoket[i]?.socket == socket) {
//                     currentUserRoom = allScoket[i]?.room
//                 }
//             }
//             for (let i = 0; i < allScoket.length; i++) {
//                 if (allScoket[i]?.room == currentUserRoom) {
//                     allScoket[i]?.socket.send(parsedMessage);
//                 }
//             }
//         }
//     });
// })