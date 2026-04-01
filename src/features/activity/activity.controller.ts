import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { getProjectActivityLogs } from "./activity.service";

export const getProjectActivityLogsController = async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const logs = await getProjectActivityLogs(projectId, limit, offset);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Activity logs fetched successfully",
            logs
        )
    )
}