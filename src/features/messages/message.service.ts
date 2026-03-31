import { and, eq } from "drizzle-orm";
import { projectUsers } from "../../db/schema";
import { ApiError } from "../../utils/ApiError";
import { threadService } from "../projectThreads/projectThread.service";
import { messages } from "../../db/schema/messages";
import { db } from "../../db";

class MessageService {
    async createMessage(options: {
        threadId: number;
        userId: number;
        systemRole: string;
        content: string;
        parentId?: number;
    }){
        const thread = await threadService.getThreadById(options.threadId, options.userId, options.systemRole);

        if(!thread){
            throw new ApiError(404, "Thread not found");
        }

        if(!(options.systemRole === "admin" || options.systemRole === "super_admin")){
            const isMember = await db.select().from(projectUsers).where(
                and(
                    eq(projectUsers.projectId, thread.projectId),
                    eq(projectUsers.userId, options.userId)
                )
            )

          if(isMember.length === 0){
            throw new ApiError(403, "You are not a member of this project");
          }
            
        }

        if (options.parentId) {
  const [parent] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, options.parentId));

  if (!parent || parent.threadId !== options.threadId) {
    throw new ApiError(400, "Invalid parent message");
  }
}
        const [message] = await db.insert(messages).values({
            threadId: options.threadId,
            userId: options.userId,
            content: options.content,
            parentId: options.parentId
        }).returning();

        return message;
    }

    async getBythread(threadId: number, userId: number, systemRole: string) {

  if (!(systemRole === "admin" || systemRole === "super_admin")) {

    const thread = await threadService.getThreadById(threadId, userId, systemRole);

    if (!thread) {
      throw new ApiError(404, "Thread not found or access denied");
    }
  }

  const allMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.threadId, threadId),
        eq(messages.isDeleted, false)
      )
    )
    .orderBy(messages.createdAt);

  const parentMessages = allMessages.filter(m => !m.parentId);
  const replies = allMessages.filter(m => m.parentId);

  const replyMap = new Map<number, any[]>();

  for (const reply of replies) {
    if (reply.parentId !== null) {
      if (!replyMap.has(reply.parentId)) {
        replyMap.set(reply.parentId, []);
      }
      replyMap.get(reply.parentId)!.push(reply);
    }
  }

  const result = parentMessages.map(parent => ({
    ...parent,
    replies: replyMap.get(parent.id) || [],
  }));

  return result;
}
}

export const messageService = new MessageService();