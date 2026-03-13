import { Request, Response } from "express";
import { taskService } from "./task.service";
import { ApiResponse } from "../../utils/ApiResponse";

export async function createTaskController(req: Request, res: Response){
    const task =  await taskService.createTask({
        threadId: Number(req.params.threadId),
        title: req.body.title,
        description: req.body.description,
        gitLink: req.body.gitLink,
        targetDate: req.body.targetDate ? new Date(req.body.targetDate) : undefined,
        userId: Number(req.user?.id),
        systemRole: req.user?.systemRole
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                "Task created successfully",
                task
            )
        )
}

export async function getTask(req: Request, res: Response){

    const task = await taskService.getTaskByIdService(
      Number(req.params.taskId),
      Number(req.user?.id),
      req.user?.systemRole!
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
    const tasks = await taskService.getThreadTasksService(
        Number(req.params.threadId),
        Number(req.user?.id),
        req.user?.systemRole!
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
    const updatedTask = await taskService.updateTask(Number(req.params.taskId), req.body, req.user?.id!, req.user?.systemRole!);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Task updated successfully",
            updatedTask
        )
    )
}

export async function updateTaskStatusController(req: Request, res: Response){
    const updatedTask = await taskService.updateTaskStatus(Number(req.params.taskId), req.body.status, req.user?.id!, req.user?.systemRole!);

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