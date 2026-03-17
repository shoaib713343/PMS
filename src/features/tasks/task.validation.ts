import {z} from "zod";

export const createtaskSchema = z.object({
    params: z.object({
        threadId: z.string(),
    }),
    body: z.object({
        title: z.string(),
        description: z.string().optional(),
        gitLink: z.string().optional(),
        targetDate: z.string().optional(),
    
    })
});

export const updateTaskSchema = z.object({
    params: z.object({
        taskId: z.string(),
        userId: z.string()
    }),
    body: z.object({
        title: z.string(),
        description: z.string().optional(),
        gitLink: z.string().optional(),
        targetDate: z.string().optional(),
    })
})

export const updateTaskStatusSchema = z.object({
    params: z.object({
        taskId: z.string()
    }),
    body: z.object({
        status: z.enum(["pending", "in_progress", "completed"])
    })
})