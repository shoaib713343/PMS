import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { uploadAttchmentService } from "./attachment.service";
import { Request, Response } from "express";

export async function uploadTaskAttachment(req: Request, res: Response){
  const file = req.file;
  const { taskId } = req.params;

  const messageId = req.params.messageId;

  if (!taskId) {
    throw new ApiError(400, "Task ID is required");
  } 

  const attachment = await uploadAttchmentService.uploadAttachment(
    file!,
    Number(taskId),
    undefined
    
  );

  return res.status(201).json(
    new ApiResponse(201, "File uploaded successfully", attachment)
  );
};

export async function deleteAttachment(req: Request, res: Response){
    const { attachmentId } = req.params;

    if(!attachmentId){
        throw new ApiError(400, "Attachment ID is required");
    }
    await uploadAttchmentService.deleteAttachment(Number(attachmentId));

    return res.status(200).json(
        new ApiResponse(200, "Attachment deleted successfully")
    );
}