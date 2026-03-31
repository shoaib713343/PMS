import { Request, Response } from "express";
import { taskService } from "./task.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";

export async function createTaskController(req: Request, res: Response) {
  const { threadId } = req.params;

  const {
    title,
    description,
    gitLink,
    targetDate, 
    assignedUserIds,
  } = req.body;

  const userId = req.user?.id;
  const systemRole = req.user?.systemRole;

  const task = await taskService.createTask({
    threadId: Number(threadId),
    title,
    description,
    gitLink,
    targetDate: targetDate ? new Date(targetDate) : undefined,
    userId,
    systemRole,
    assignedUserIds,
  });

  return res.status(201).json(
    new ApiResponse(201, "Task created successfully", task)
  );
}

export async function getAllTasksController(req: Request, res: Response) {
  const userId = req.user?.id;
  const role = req.user?.systemRole!;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sortBy as string;
  const order = req.query.order as string;

  const result = await taskService.getTasksForUser(Number(userId), role, {
    page,
    limit,
    sortBy,
    order,
  });

  return res.status(200).json(
    new ApiResponse(200, "Tasks fetched successfully", result)
  );
}

export async function getTask(req: Request, res: Response){

    const task = await taskService.getTaskByIdService(
      Number(req.params.taskId),
      Number(req.user?.id),
      req.user?.systemRole!,
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Task fetched successfully",
            task
        )
    )

};


export async function getThreadTasks(req: Request, res: Response) {

    const pagination = getPagination(req.query);
    const tasks = await taskService.getThreadTasksService(
        Number(req.params.threadId),
        Number(req.user?.id),
        req.user?.systemRole!,
        pagination,
        req.query
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Tasks fetched successfully",
            tasks
        )
    )
}

export async function updateTakController(req: Request, res: Response) {
    const updatedTask = await taskService.updateTask(
        req.body.title,
        req.body.description,
        req.body.gitLink,
        req.body.targetDate ? new Date(req.body.targetDate) : undefined,
        Number(req.user?.id),
        req.user?.systemRole!,
        Number(req.params.taskId),
        req.body.status
    )
    return res.status(200).json(
        new ApiResponse(
            200,
            "Task updated successfully",
            updatedTask
        )
    )
}

export async function updateTaskStatusController(req: Request, res: Response){
    const updatedTask = await taskService.updateTaskStatus(
        Number(req.params.taskId),
        req.body.status,
        Number(req.user?.id),
        req.user?.systemRole!,

    )
    return res.status(200).json(
        new ApiResponse(
            200,
            "Task status updated successfully",
            updatedTask
        )
    )
}

export async function deleteTaskController(req: Request, res: Response) {
    await taskService.deleteTask(Number(req.params.taskId), req.user?.id!, req.user?.systemRole!);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Task deleted successfully"
        )
    )
}