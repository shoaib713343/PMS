import { Request, Response } from "express";
import { messageService } from "./message.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

export async function createMessageController(req: Request, res: Response){
    const message = await messageService.createMessage({
        threadId: Number(req.params.threadId),
        userId: Number(req.user?.id),
        systemRole: req.user?.systemRole ?? "",
        content : req.body.content,
        parentId: req.body.parentId
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            "Message created successfully",
            message
        )
    )
}

export const replyToMessage = async (req: Request, res: Response) => {
  const threadId = Number(req.params.threadId);
  const parentId = Number(req.params.messageId);
  const userId = Number(req.user?.id);
  const systemRole = req.user?.systemRole || "";

  if (!req.body.content) {
    throw new ApiError(400, "Content is required");
  }

  const reply = await messageService.createMessage({
    threadId,
    userId,
    content: req.body.content,
    parentId,
    systemRole,
  });

  res.status(201).json({
    success: true,
    data: reply,
  });
};

export const getMessages = async (req: Request, res: Response) => {
  const threadId = Number(req.params.threadId);
  const userId = Number(req.user?.id);
  const systemRole = req.user?.systemRole || "";

  const messages = await messageService.getBythread(
    threadId,
    userId,
    systemRole
  );

  res.status(200).json({
    success: true,
    data: messages,
  });
};