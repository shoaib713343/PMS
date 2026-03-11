import { Request, Response } from "express";
import { threadService } from "./projectThread.service";
import { ApiResponse } from "../../utils/ApiResponse";

export const createThreadController = async (req: Request, res: Response) => {

  const thread = await threadService.createThread({
    ...req.body,
    projectId: Number(req.params.projectId),
    userId: req.user?.id
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      "Thread created successfully",
      thread
    )
  );
};


export const getThreadsByProjectIdController = async (req: Request, res: Response) => {

  const threads = await threadService.getThreadsByProjectId(
    Number(req.params.projectId),
    Number(req.user?.id)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Threads fetched successfully",
      threads
    )
  );
};


export const getThreadByIdController = async (req: Request, res: Response) => {

  const thread = await threadService.getThreadById(
    Number(req.params.threadId),
    Number(req.user?.id)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Thread fetched successfully",
      thread
    )
  );
};


export const updateThreadController = async (req: Request, res: Response) => {

  const updatedThread = await threadService.updateThread(
    Number(req.params.threadId),
    req.body,
    Number(req.user?.id)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Thread updated successfully",
      updatedThread
    )
  );
};


export const deleteThreadController = async (req: Request, res: Response) => {

  await threadService.deleteThread(
    Number(req.params.threadId),
    Number(req.user?.id)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Thread deleted successfully"
    )
  );
};