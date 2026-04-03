export const ACTIONS = {
    CREATE_PROJECT: "project:create",
    UPDATE_PROJECT: "project:update",
    DELETE_PROJECT: "project:delete",
    VIEW_PROJECT: "project:view",
    INVITE_MEMBER: "project:invite_member",

    CREATE_TASK: "task:create",
    UPDATE_TASK: "task:update",
    DELETE_TASK: "task:delete",
    VIEW_TASK: "task:view",
    ASSIGN_TASK: "task:assign",

    CREATE_THREAD: "thread:create",
    UPDATE_THREAD: "thread:update",
    DELETE_THREAD: "thread:delete",
    VIEW_THREAD: "thread:view",

    SEND_MESSAGE: "message:send",
    DELETE_MESSAGE: "message:delete"
} as const;