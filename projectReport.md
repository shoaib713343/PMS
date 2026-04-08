# Project Management System (PMS) Backend – Technical Report

## 1. Overview
The backend supports project creation, user-role assignment, threads, task management (under threads AND directly under projects), messaging with replies, file handling (Cloudinary), deployment tracking, and activity logging.

**Tech Stack:** Node.js, Express.js, TypeScript, PostgreSQL (Neon), Drizzle ORM, Cloudinary, JWT.

## 2. API Base Path
`/api/v1`

## 3. Implemented APIs

**Authentication:** POST /auth/register, /login, /refresh, /logout (JWT + refresh tokens)

**Projects:** POST /, GET /, GET /:projectId, PUT /:projectId, DELETE /:projectId | Members: POST /:projectId/members, DELETE /:projectId/members/:userId

**Threads:** POST /, GET /, GET /:threadId, PATCH /:threadId, PATCH /:threadId/status, DELETE /:threadId (under /projects/:projectId/threads)

**Tasks:** 
- Thread-based: POST /threads/:threadId/tasks, GET /threads/:threadId/tasks
- Project-based: POST /projects/:projectId/tasks, GET /projects/:projectId/tasks
- Common: GET /tasks/:taskId, PATCH /tasks/:taskId, PATCH /tasks/:taskId/status, DELETE /tasks/:taskId

**Messaging:** POST /threads/:threadId/messages, POST /threads/:threadId/messages/:messageId/replies, GET /threads/:threadId/messages

**Attachments:** POST /projects/:projectId/threads/:threadId/tasks/:taskId/attachments, DELETE /attachments/:attachmentId

**Deployment & Services:**
- Servers: POST /deployment/servers, GET /deployment/servers, PUT /deployment/servers/:serverId, DELETE /deployment/servers/:serverId
- Services: POST /deployment/services, GET /deployment/services, PUT /deployment/services/:serviceId, DELETE /deployment/services/:serviceId
- Assignments: POST /deployment/projects/:projectId/servers/:serverId, POST /deployment/users/:userId/services/:serviceId, DELETE /deployment/users/:userId/services/:serviceId

**Dashboard:** GET /dashboard (role-based data aggregation)

## 4. File Handling
- Project user_manual and task attachments uploaded via Multer (memory storage)
- Stored in Cloudinary, supports images, PDFs, Word docs (max 2MB)
- Metadata stored in PostgreSQL with synchronized deletion

## 5. Permission System
**System Roles:** user, admin, super_admin
**Project Roles:** project_admin (full), project_member (read/write), project_viewer (read-only)
**Access Control:** RBAC with middleware + service-level validation for all operations

## 6. Validation & Error Handling
- Zod for request body, params, query validation
- Centralized error handler with custom ApiError and ApiResponse wrappers

## 7. Database Schema (12+ tables)
**Core:** users, roles, projects, project_users, project_threads, tasks, task_assignees, messages, attachments, activity_logs
**Deployment:** servers, services, project_servers, user_services

**Relationships:** Project → Threads → Messages → Replies | Project → Tasks (direct) | Project → Members | Project → Servers | User → Services

## 8. Deployment
- Backend: Render.com (port 10000, auto-deploy from main)
- Database: Neon PostgreSQL (serverless)
- Storage: Cloudinary
- Environment variables: DATABASE_URL, CLOUDINARY_*, JWT_SECRET, PORT

## 9. Current Status

**✅ Completed:** Full authentication, project/thread/task CRUD, dual task creation (project + thread), messaging with replies, file uploads, RBAC, deployment tracking, activity logging, dashboard, soft delete.

**🔄 Partial:** Permission centralization, thread enhancements.

**📋 Future:** Real-time notifications, task comments, advanced search, bulk operations, API documentation (Swagger), automated testing.

## 10. Summary

**Status:** ✅ Production-ready | **Version:** 1.0.0 | **Endpoints:** 30+ | **Tables:** 12+

**Key Strengths:** Clean modular architecture, comprehensive RBAC, optimized database, cloud file handling, flexible task management, complete deployment tracking, full audit trail.

**Base URL:** `https://pms-l909.onrender.com/api/v1`