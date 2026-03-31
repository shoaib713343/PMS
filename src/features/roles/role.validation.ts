import {z} from "zod";

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(20)
    })
});

export const updateRoleSchema = z.object({
    params: z.object({
        id:z.string().uuid()
    }),
    body: z.object({
        name: z.string().min(3).max(20)
    })
});