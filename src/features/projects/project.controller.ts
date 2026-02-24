import { Request, Response } from "express";
import { projectService } from "./project.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

export async function createProjectController(req: Request, res: Response){

    const project = await projectService.createProject({
        title: req.body.title,
        description: req.body.description,
        createdBy: req.user?.id || "",
        members: req.body.members,
    })

    return res.status(201).json(
        new ApiResponse(201, "Project created successfully", project)
    );
}

export const listProjectsController = async (req: Request, res: Response) => {
  const user = req.user!;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const projects = await projectService.listProjects(
    user.id,
    user.systemRole,
    page,
    limit
  );

  res.status(200).json({
    success: true,
    data: projects,
  });
};

export const getProjectDetailsController = async (
  req: Request,
  res: Response
) => {
  const  projectIdString  = req.params.projectId;
  const projectId = projectIdString.toString();
  const user = req.user!;

  const project = await projectService.getProjectDetails(
    projectId,
    user.id,
    user.systemRole
  );

  res.status(200).json({
    success: true,
    data: project,
  });
};

export const updateProjectController = async (
  req: Request,
  res: Response
) => {
  const  projectId  = req.params.projectId;
  const { title, description } = req.body;

  const updated = await projectService.updateProject(projectId.toString(), {
    title,
    description,
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
};

export const deleteProjectController = async (
  req: Request,
  res: Response
) => {
  const { projectId } = req.params;
  const user = req.user!;

  await projectService.deleteProject(projectId.toString(), user.id);

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
};

export async function assignProjectMember(req: Request, res: Response){
    const  projectIdString  = req.params.projectId;
    const { userId, roleName } = req.body;

    const projectId = projectIdString.toString();

    const currentUser = req.user;

    if (!currentUser) {
      throw new ApiError(401, "Unauthorized");
    }

    if (
      currentUser.systemRole !== "admin" &&
      currentUser.systemRole !== "super_admin"
    ) {
      throw new ApiError(403, "Not allowed to assign members");
    }

    await projectService.assignUserToProject({
      projectId,
      userId,
      roleName,
    });

    res.status(200).json({
      message: "User assigned successfully",
    });
};


export const removeProjectMemberController = async (
  req: Request,
  res: Response
) => {
  const { projectId, userId } = req.params;
  const currentUser = req.user!;

  await projectService.removeProjectMember(
    projectId.toString(),
    userId.toString(),
    currentUser.systemRole
  );

  res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
};



