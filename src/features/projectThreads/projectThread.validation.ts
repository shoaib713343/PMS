import {z} from "zod";

export const createThreadSchema = z.object({
    params: z.object({
        porjectId: z.string()
    }),
    body: z.object({
        topic: z.string().min(3, "Topic must be at least 3 characters long"),
    description: z.string().min(5, "Description must be at least 5 characters long"),
    priority: z.number().optional(),
    assignUserId: z.union([z.number(), z.null()]).transform(val => Number(val)).optional(),
    dueDate: z.string().optional()
    })
});