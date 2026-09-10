import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prismaClient } from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common/config.js";
import { SignupSchema, SigninSchema, CreateRoomSchema } from "@repo/backend-common/types.js";
import { authMiddleware } from "./middleware.js";

const prisma = prismaClient;
const app = express();
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", webOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json());


app.post("/api/v1/signup", async (req, res) => {
    try {
        const parsed = SignupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid signup details",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const { username, email, password } = parsed.data;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username, email, password: hashedPassword
            }
        })
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET, { expiresIn: "7d" });

        return res.status(201).json({
            message: "Signup successfully",
            token,

        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/api/v1/signin", async (req, res) => {
    try {
        const parsed = SigninSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid signin details",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const { email, password } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET, { expiresIn: "7d" });
        return res.status(200).json({ token });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/api/v1/room", authMiddleware, async (req, res) => {

    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Incorrect inputs"
        });
    }
    //@ts-ignore
    const userId = req.userId;

    try {
        const room = await prisma.room.create({
            data: {
                slug: parsedData.data.name,
                title: parsedData.data.name,
                adminId: userId
            }
        })

        return res.status(201).json({
            message: "Success",
            roomId: room.id
        })
    } catch (error) {
        return res.status(411).json({
            message: "Room name already exists"
        });
    }
});

app.get("/api/v1/rooms", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    try {
        const rooms = await prisma.room.findMany({
            where: {
                adminId: userId
            },
            orderBy: {
                updatedAt: "desc"
            }
        });
        res.json({ rooms });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/api/v1/rooms/:roomId", authMiddleware, async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
    }
    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { elements: true }
        });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.json({ room });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.put("/api/v1/rooms/:roomId", authMiddleware, async (req, res) => {
    const roomId = Number(req.params.roomId);
    //@ts-ignore
    const userId = req.userId;
    const { backgroundColor, title } = req.body;
    try {
        const room = await prisma.room.update({
            where: { id: roomId, adminId: userId },
            data: { backgroundColor, title }
        });
        res.json({ room });
    } catch (error) {
        res.status(500).json({ message: "Error updating room" });
    }
});

app.post("/api/v1/elements", authMiddleware, async (req, res) => {
    const { elements, roomId } = req.body; // elements is array of {id, data}
    if (!elements || !roomId) {
        return res.status(400).json({ message: "Invalid payload" });
    }
    try {
        // Simple strategy: we can upsert or just let websocket handle it and this endpoint can just overwrite or do bulk upsert
        // For Excalidraw style: usually elements are synced individually or we just dump them.
        for (const el of elements) {
            await prisma.element.upsert({
                where: { id: el.id },
                create: { id: el.id, roomId: Number(roomId), data: el.data },
                update: { data: el.data }
            });
        }
        res.status(200).json({ message: "Elements synced" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/api/v1/chats/:roomId", authMiddleware, async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
    }
    const messages = await prisma.chat.findMany({
        where: {
            roomId: roomId
        },
        orderBy: {
            id:"desc"
        }, take: 50
    });
    res.json({
        messages
    })
})

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});