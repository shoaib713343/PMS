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

  const user = req.user!;

  const task = await taskService.createTask({
    threadId: Number(threadId),
    title,
    description,
    gitLink,
    targetDate: targetDate ? new Date(targetDate) : undefined,
    assignedUserIds,
  }, user);

  return res.status(201).json(
    new ApiResponse(201, "Task created successfully", task)
  );
}

export async function getAllTasksController(req: Request, res: Response) {
  const user = req.user!;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sortBy = req.query.sortBy as string;
  const order = req.query.order as string;

  const result = await taskService.getTasksForUser(user, {
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

    const task = await taskService.getTaskById(
      Number(req.params.taskId),
      req.user!
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
        req.user!,
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

export async function updateTaskController(req: Request, res: Response) {
    const updatedTask = await taskService.updateTask(
      Number(req.params.taskId),
      {
        title: req.body.title,
        description: req.body.description,
        gitLink: req.body.gitLink,
        targetDate: req.body.targetDate ? new Date(req.body.targetDate) : undefined,
        taskStatus: req.body.taskStatus
      },
      req.user!
    );
    
    return res.status(200).json(
      new ApiResponse(
        200,
        "Task updated successfully",
        updatedTask
      )
    );
  
}

export async function updateTaskStatusController(req: Request, res: Response){
    const updatedTask = await taskService.updateTaskStatus(
        Number(req.params.taskId),
        req.body.status,
        req.user!

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
    await taskService.deleteTask(Number(req.params.taskId), req.user!);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Task deleted successfully"
        )
    )
}