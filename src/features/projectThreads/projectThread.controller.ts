import { Request, Response } from "express";
import { threadService } from "./projectThread.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";
import { ApiError } from "../../utils/ApiError";

export const createThreadController = async (req: Request, res: Response) => {

  const projectId = Number(req.params.projectId);

  if(!projectId || isNaN(projectId)){
    return res.status(400).json(
      new ApiError(400, "Invalid project ID")
    );
  }

  const thread = await threadService.createThread({
  topic: req.body.topic,
  description: req.body.description,
  priority: req.body.priority,
  assignUserId: req.body.assignUserId,
  dueDate: req.body.dueDate,
  projectId
}, req.user!);

  return res.status(201).json(
    new ApiResponse(201, "Thread created successfully", thread)
  );
};

export const getAllThreadsController = async (req: Request, res: Response) => {
  const user = req.user!;

  const threads = await threadService.getAllThreads(user);

  res.status(200).json({
    success: true,
    data: threads,
  });
};


export const getThreadsByProjectIdController = async (req: Request, res: Response) => {

  const projectId = Number(req.params.projectId);

  if(!projectId || isNaN(projectId)){
    return res.status(400).json(
      new ApiError(400, "Invalid project ID")
    );
  }

  const pagination = getPagination(req.query);
    const thread = await threadService.createThread({
  topic: req.body.topic,
  description: req.body.description,
  priority: req.body.priority,
  assignUserId: req.body.assignUserId,
  dueDate: req.body.dueDate,
  projectId
}, req.user!);
  

  return res.status(200).json(
    new ApiResponse(
      200,
      "Threads fetched successfully",
      thread
    )
  );
};


export const getThreadByIdController = async (req: Request, res: Response) => {

  const thread = await threadService.getThreadById(
    Number(req.params.threadId),
    req.user!
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
    req.user!
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Thread updated successfully",
      updatedThread
    )
  );
};

export const updateThreadStatusController = async (req: Request, res: Response) => {
  const updatedThread = await threadService.updateThreadStatus(
    Number(req.params.threadId),
    Number(req.body.status),
    req.user!
  )
  return res.status(200).json(
    new ApiResponse(
      200,
      "Thread status updated successfully",
      updatedThread
    )
  );
}

export const deleteThreadController = async (req: Request, res: Response) => {

  await threadService.deleteThread(
    Number(req.params.threadId),
    req.user!
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      "Thread deleted successfully"
    )
  );
};