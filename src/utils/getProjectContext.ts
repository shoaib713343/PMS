import { db } from "../db";
import { ApiError } from "./ApiError";
import { getProjectRole } from "./getProjectRole";

type AuthUser = {
  id: number;
  systemRole: "user" | "admin" | "super_admin";
};

type ProjectContext = {
  project: {
    id: number;
    createdBy: number | null;
  };
  projectRole: string | null;
};

export async function getProjectContext(
  user: AuthUser,
  projectId: number
): Promise<ProjectContext> {
  
  const project = await db.query.projects.findFirst({
    columns: {
      id: true,
      createdBy: true,
    },
    where: (p, { eq }) => eq(p.id, projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (project.createdBy === null) {
  throw new ApiError(500, "Project has no creator (data issue)");
}

  const projectRole =
    user.systemRole === "super_admin"
      ? null
      : await getProjectRole(user.id, projectId);

  return { project:{id: project.id, createdBy: project.createdBy}, projectRole };
}