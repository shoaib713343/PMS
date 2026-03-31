import { z } from "zod";

export const registerUserSchema = z
  .object({
    body: z.object({
      firstName: z.string().min(2).max(100),

    lastName: z.string().min(2).max(100),


    email: z.string().email(),

    password: z.string().min(6).regex(/^(?=.*[A-Z])(?=.*[0-9]).{8,}$/),

    confirmPassword: z.string().min(6).regex(/^(?=.*[A-Z])(?=.*[0-9]).{8,}$/),

    systemRole: z.enum(["admin", "user", "super_admin"]).optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
    })
  });

  
export const loginSchema = z.object({
body: z.object({
    email: z.string().email(),
  password: z.string().min(6).regex(/^(?=.*[A-Z])(?=.*[0-9]).{8,}$/)
})
});