import {z} from "zod";

export const createUserSchema = z.object({
    body: z.object({
        firstName: z.string().min(2).max(20),
        lastName: z.string().min(2).max(20),
        email: z.string().email(),
        password: z.string().min(6),
        confirmPassword: z.string().min(6)
    })
    .refine((data)=> data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    systemRole: z.enum(["user", "admin"]).optional(),
  }),
});