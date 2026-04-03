import { Request, Response } from "express";
import { messageService } from "./message.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

export async function createMessageController(req: Request, res: Response){
    const message = await messageService.createMessage({
        threadId: Number(req.params.threadId),
        content : req.body.content,
        parentId: req.body.parentId
    }, req.user!);

    return res.status(201).json(
        new ApiResponse(
            201,
            "Message created successfully",
            message
        )
    )
}

export const replyToMessage = async (req: Request, res: Response) => {

  if (!req.body.content) {
    throw new ApiError(400, "Content is required");
  }

  const reply = await messageService.createMessage({
        threadId: Number(req.params.threadId),
        content : req.body.content,
        parentId: req.body.parentId
    }, req.user!);

  res.status(201).json({
    success: true,
    data: reply,
  });
};

export const getMessages = async (req: Request, res: Response) => {
  const threadId = Number(req.params.threadId);

  const messages = await messageService.getByThread(
    threadId,
    req.user!
  );

  res.status(200).json({
    success: true,
    data: messages,
  });
};

export const deleteMessage = async (req: Request, res: Response) => {
  const messageId = Number(req.params.messageId);

  await messageService.deleteMessage(messageId, req.user!);

  res.status(200).json(
    new ApiResponse(
      200,
      "Message deleted successfully"
    )
  );
};