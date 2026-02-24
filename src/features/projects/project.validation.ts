import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Project title must be at least 3 characters")
      .max(255, "Project title too long"),

    description: z
      .string()
      .max(1000, "Description too long")
      .optional(),

     members: z.array(
      z.object({
        userId: z.string().uuid(),
        roleName: z.string().min(2).max(100),
      })
    ).optional(),
  }),
});

export const assignUserSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
  }),
  body: z.object({
    userId: z.string().uuid(),
    roleName: z.string().min(2).max(100),
  }),
});