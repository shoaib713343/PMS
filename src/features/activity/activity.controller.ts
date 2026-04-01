import { Request, Response } from "express";
import { getProjectActivity } from "./activity.service";
import { ApiError } from "../../utils/ApiError";

export const getProjectActivityController = async (
  req: Request,
  res: Response
) => {
  const projectId = Number(req.params.projectId);

  if (!projectId || isNaN(projectId)) {
    throw new ApiError(400, "Invalid project ID");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const entity = req.query.entity as string | undefined;
  const action = req.query.action as string | undefined;

  const result = await getProjectActivity({
    projectId,
    page,
    limit,
    entity,
    action,
  });

  return res.json({
    success: true,
    ...result,
  });
};