// project.controller.ts
import { Request, Response } from "express";
import { projectService } from "./project.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination } from "../../utils/pagination";
import cloudinary from "../../config/cloudinary";
import fs from "fs";

export async function createProjectController(req: Request, res: Response) {
  try {
    const file = req.file;
    let manualUrl = undefined;

    if (file) {
      // Fix: Use buffer instead of path since using memoryStorage
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "project_manuals" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
      
      const result = uploadResult as any;
      manualUrl = result.secure_url;
      // No need for fs.unlinkSync since there's no file on disk
    }

    // Rest of your code remains the same...
    let members = req.body.members;
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch (e) {
        console.error('Failed to parse members:', e);
        members = [];
      }
    }

    const validMembers = Array.isArray(members) ? members
      .filter(m => m && m.userId && m.roleName)
      .map(m => ({
        userId: Number(m.userId),
        roleName: m.roleName.trim()
      })) : [];

    const project = await projectService.createProject({
      title: req.body.title,
      description: req.body.description,
      createdBy: Number(req.user?.id),
      members: validMembers,
      userManualUrl: manualUrl,
    });

    return res.status(201).json(
      new ApiResponse(201, "Project created successfully", project)
    );
  } catch (error: any) {
    console.error('Create project error:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, error.message || "Failed to create project");
  }
}

export const listProjectsController = async (req: Request, res: Response) => {
  const user = req.user!;
  const pagination = getPagination(req.query);
  const projects = await projectService.listProjects(user, pagination);

  res.status(200).json({
    success: true,
    data: projects,
  });
};

export const getProjectDetailsController = async (
  req: Request,
  res: Response
) => {
  const projectId = Number(req.params.projectId);
  const user = req.user!;
  const project = await projectService.getProjectDetails(Number(projectId), user);

  res.status(200).json({
    success: true,
    data: project,
  });
};

export const updateProjectController = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.projectId;
  const { title, description } = req.body;
  const user = req.user!;

  const updated = await projectService.updateProject(
    Number(projectId),
    user,
    {
      title,
      description,
    }
  );

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
  await projectService.deleteProject(Number(projectId), user);

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
};

export async function assignProjectMember(req: Request, res: Response) {
  const projectId = Number(req.params.projectId);
  const { userId, roleName } = req.body;
  const currentUser = req.user;

  if (!currentUser) {
    throw new ApiError(401, "Unauthorized");
  }

  if (currentUser.systemRole !== "admin" && currentUser.systemRole !== "super_admin") {
    throw new ApiError(403, "Not allowed to assign members");
  }

  if (isNaN(projectId)) {
    throw new ApiError(400, "Invalid projectId");
  }

  const parsedUserId = Number(userId);
  if (!userId || isNaN(parsedUserId)) {
    throw new ApiError(400, "Invalid userId");
  }

  if (!roleName) {
    throw new ApiError(400, "roleName is required");
  }

  await projectService.assignUserToProject(
    projectId,
    parsedUserId,
    roleName,
    currentUser
  );

  res.status(200).json({
    success: true,
    message: "User assigned successfully",
  });
}

export const removeProjectMemberController = async (
  req: Request,
  res: Response
) => {
  const { projectId, userId } = req.params;
  const currentUser = req.user!;
  await projectService.removeProjectMember(Number(projectId), Number(userId), currentUser);

  res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
};