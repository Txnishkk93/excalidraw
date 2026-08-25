import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization ?? "";

    if (!JWT_SECRET) {
        res.status(404).send("JWT_SECRET is not configured");
        return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded) {
        return res.userId = decoded.userId;
        next();
    } else {
        return res.status(404).json({
            message: "Unauthorized"
        });
    }
}