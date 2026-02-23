import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Project name must be at least 3 characters")
      .max(255, "Project name too long"),

    description: z
      .string()
      .max(1000, "Description too long")
      .optional(),

    projectRole: z
      .string()
      .min(2, "Role name must be at least 2 characters")
      .max(100, "Role name too long"),
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