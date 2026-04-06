import { Request, Response } from "express";
import { taskService } from "./task.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { getPagination } from "../../utils/pagination";

export async function createTaskController(req: Request, res: Response) {
  const { threadId, projectId } = req.params;

  const {
    title,
    description,
    gitLink,
    targetDate, 
    assignedUserIds,
  } = req.body;

  const user = req.user!;

  const task = await taskService.createTask({
    projectId: projectId ? Number(projectId) : undefined,
    threadId: threadId ? Number(threadId) : undefined,
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

// FIXED: Add validation for taskId
export async function getTask(req: Request, res: Response) {
    // Validate taskId parameter
    const taskId = Number(req.params.taskId);
    
    if (isNaN(taskId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid task ID: ID must be a valid number", null)
        );
    }
    
    const task = await taskService.getTaskById(taskId, req.user!);

    return res.status(200).json(
        new ApiResponse(200, "Task fetched successfully", task)
    )
};

export async function getProjectTasksController(req: Request, res: Response) {
    const { projectId } = req.params;
    const user = req.user!;
    
    // Validate projectId
    const projectIdNum = Number(projectId);
    if (isNaN(projectIdNum)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid project ID", null)
        );
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy as string;
    const order = req.query.order as string;

    const result = await taskService.getProjectTasksService(
        projectIdNum,
        user,
        { page, limit, sortBy, order }
    );

    return res.status(200).json(
        new ApiResponse(200, "Project tasks fetched successfully", result)
    );
}

export async function getThreadTasks(req: Request, res: Response) {
    // Validate threadId
    const threadId = Number(req.params.threadId);
    if (isNaN(threadId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid thread ID", null)
        );
    }
    
    const pagination = getPagination(req.query);
    const tasks = await taskService.getThreadTasksService(
        threadId,
        req.user!,
        pagination,
        req.query
    );

    return res.status(200).json(
        new ApiResponse(200, "Tasks fetched successfully", tasks)
    )
}

// FIXED: Add validation for taskId
export async function updateTaskController(req: Request, res: Response) {
    const taskId = Number(req.params.taskId);
    
    if (isNaN(taskId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid task ID: ID must be a valid number", null)
        );
    }
    
    const updatedTask = await taskService.updateTask(
        taskId,
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
        new ApiResponse(200, "Task updated successfully", updatedTask)
    );
}

// FIXED: Add validation for taskId and status
export async function updateTaskStatusController(req: Request, res: Response) {
    const taskId = Number(req.params.taskId);
    
    if (isNaN(taskId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid task ID: ID must be a valid number", null)
        );
    }
    
    if (!req.body.status) {
        return res.status(400).json(
            new ApiResponse(400, "Status is required", null)
        );
    }
    
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json(
            new ApiResponse(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, null)
        );
    }
    
    const updatedTask = await taskService.updateTaskStatus(
        taskId,
        req.body.status,
        req.user!
    );
    
    return res.status(200).json(
        new ApiResponse(200, "Task status updated successfully", updatedTask)
    );
}

// FIXED: Add validation for taskId
export async function deleteTaskController(req: Request, res: Response) {
    const taskId = Number(req.params.taskId);
    
    if (isNaN(taskId)) {
        return res.status(400).json(
            new ApiResponse(400, "Invalid task ID: ID must be a valid number", null)
        );
    }
    
    await taskService.deleteTask(taskId, req.user!);

    return res.status(200).json(
        new ApiResponse(200, "Task deleted successfully")
    );
}