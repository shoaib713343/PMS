import { db } from "../db";
import { ApiError } from "./ApiError";
import { getProjectRole } from "./getProjectRole";

type AuthUser = {
  id: number;
  systemRole: "user" | "admin" | "super_admin";
};

type Project = {
  id: number;
  createdBy: number | null;
};

type ProjectContext = {
  project: Project;
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
    // cast to any to avoid duplicate-drizzle typing mismatch between packages
    where: ((p: { id: any; }, { eq }: any) => eq(p.id, projectId)) as any,
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