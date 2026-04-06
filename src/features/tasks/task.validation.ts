// task.validation.ts
import {z} from "zod";

export const createtaskSchema = z.object({
    params: z.object({
        threadId: z.string().optional(),
        projectId: z.string().optional(),
    }),
    body: z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        gitLink: z.string().optional().nullable(),
        targetDate: z.string().optional(),
        assignedUserIds: z.array(z.number()).optional(),
    })
});

export const updateTaskSchema = z.object({
    params: z.object({
        taskId: z.string().regex(/^\d+$/, "Task ID must be a number"),
    }),
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        gitLink: z.string().optional().nullable(),
        targetDate: z.string().optional(),
        taskStatus: z.enum(["pending", "in_progress", "completed"]).optional(),
    })
});

export const updateTaskStatusSchema = z.object({
    params: z.object({
        taskId: z.string().regex(/^\d+$/, "Task ID must be a number")
    }),
    body: z.object({
        status: z.enum(["pending", "in_progress", "completed"])
    })
});