import { Request, Response } from "express";
import { taskReminderService } from "../../services/taskReminder.service";
import { ApiResponse } from "../../utils/ApiResponse";

export async function triggerRemindersManuallyController(req: Request, res: Response) {
    const result = await taskReminderService.runDueDateReminders();
    
    return res.status(200).json(
        new ApiResponse(200, "Reminder job completed", result)
    );
}