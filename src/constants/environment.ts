export const ENVIRONMENTS = {
  DEVELOPMENT: 1,
  STAGING: 2,
  PRODUCTION: 3,
} as const;

export const SERVER_TYPES = {
  WEB: 1,
  DATABASE: 2,
  WORKER: 3,
  STORAGE: 4,
} as const;

export const ACCESS_LEVELS = {
  READ: "read",
  WRITE: "write",
  ADMIN: "admin",
} as const;