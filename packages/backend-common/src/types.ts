import { email, z } from "zod";

export const CreateUserSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string(),
    password: z.string()
})

export const SignupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(30),
    email: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters")
})

export const SigninSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20),
})