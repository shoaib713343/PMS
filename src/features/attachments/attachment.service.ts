import { eq } from "drizzle-orm";
import cloudinary from "../../config/cloudinary";
import { db } from "../../db";
import { attachments } from "../../db/schema/attachments";
import { ApiError } from "../../utils/ApiError";
import fs from "fs";

class UploadAttachmentService {
  async uploadAttachment(
    file: Express.Multer.File,
    taskId?: number,
    messageId?: number
  ) {
    if (!file) {
      throw new ApiError(400, "File is required");
    }


    const result = await cloudinary.uploader.upload(file.path, {
      folder: taskId
        ? `attachments/tasks/${taskId}`
        : `attachments/messages/${messageId}`,
    });

    if (!result || !result.secure_url) {
      throw new ApiError(500, "Failed to upload file to Cloudinary");
    }

    fs.unlinkSync(file.path);

    const [attachment] = await db.insert(attachments).values({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      fileName: file.originalname,
      fileSize: file.size,
      taskId: taskId ?? null,
      messageId: messageId ?? null,
    }).returning();

    return attachment;
  }

  async deleteAttachment(attachmentId: number){
    const attachment = await db.query.attachments.findFirst({
        where: eq(attachments.id, attachmentId)
    })

    if(!attachment){
        throw new ApiError(404, "Attachment not found");
    }
    await cloudinary.uploader.destroy(attachment.publicId);
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

    return true;
  }
}

export const uploadAttchmentService = new UploadAttachmentService();