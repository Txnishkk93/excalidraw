import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prismaClient } from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common/config.js";
import { SignupSchema, SigninSchema, CreateUserSchema } from "@repo/backend-common/types.js";

const prisma = prismaClient;
const app = express();
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
        console.log(error)
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

app.post("/api/v1/room", async (req, res) => {

    const paresedData = CreateUserSchema.safeParse(req.body);
    if (!paresedData.success) {
        return res.status(404).json({
            message: "Incorrect inputs"
        });
        return;
    }
    //@ts-ignore
    const userId = req.userId;

    try {
        const room = await prisma.room.create({
            data: {
                slug: paresedData.data.username,
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

app.listen(3000)