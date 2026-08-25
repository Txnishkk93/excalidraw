import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthMiddleware } from "./middlewares/AuthMiddleware.js";
dotenv.config();
const app = express();
const userId = 1;


app.post("/api/v1/signup",  async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All details required"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username, email, password: hashedPassword
            }
        })
        const token = jwt.sign({
            userId
        }, process.env.JWT_SECRET as string, { expiresIn: '7d' })

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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All details required"
            });
        }

        const existingUser = await prisma.user.findunique({
            where: {
                email,
                password
            }
        });

        if (!existingUser) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/api/v1/room", async (req, res) => {

})

app.listen(3000)