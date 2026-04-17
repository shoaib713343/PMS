# Project Management System (PMS) Backend – Technical Report (v2.0)

## 1. Overview
The backend supports project creation, user-role assignment, threads, task management (under threads AND directly under projects), messaging with replies, file handling (Cloudinary), deployment tracking, activity logging, **email notifications**, **in-app notifications**, and **automated task reminders**.

**Tech Stack:** Node.js, Express.js, TypeScript, PostgreSQL (Neon), Drizzle ORM, Cloudinary, JWT, Nodemailer, node-cron.

---

## 2. API Base Path
/api/v1

text

---

## 3. Implemented APIs

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects` | Create project (with optional user manual) |
| GET | `/projects` | List projects (with pagination & sorting) |
| GET | `/projects/:projectId` | Get project details |
| PUT | `/projects/:projectId` | Update project |
| DELETE | `/projects/:projectId` | Delete project (soft delete) |
| POST | `/projects/:projectId/members` | Add/update member |
| DELETE | `/projects/:projectId/members/:userId` | Remove member |

### Threads
*(All under `/projects/:projectId/threads`)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create thread |
| GET | `/` | List threads by project |
| GET | `/:threadId` | Get thread details |
| PATCH | `/:threadId` | Update thread |
| PATCH | `/:threadId/status` | Update thread status |
| DELETE | `/:threadId` | Delete thread |

### Tasks

**Thread-based:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/threads/:threadId/tasks` | Create task under thread |
| GET | `/threads/:threadId/tasks` | Get tasks by thread |

**Project-based:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/:projectId/tasks` | Create task directly under project |
| GET | `/projects/:projectId/tasks` | Get all project tasks |

**Common:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/:taskId` | Get task by ID |
| PATCH | `/tasks/:taskId` | Update task |
| PATCH | `/tasks/:taskId/status` | Update task status |
| DELETE | `/tasks/:taskId` | Delete task (soft delete) |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/threads/:threadId/messages` | Add message to thread |
| POST | `/threads/:threadId/messages/:messageId/replies` | Reply to message |
| GET | `/threads/:threadId/messages` | Get all messages with nested replies |

### Attachments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/:projectId/threads/:threadId/tasks/:taskId/attachments` | Upload task attachment |
| DELETE | `/attachments/:attachmentId` | Delete attachment |

### Deployment & Services

**Servers:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/deployment/servers` | Create server |
| GET | `/deployment/servers` | List servers |
| PUT | `/deployment/servers/:serverId` | Update server |
| DELETE | `/deployment/servers/:serverId` | Delete server |

**Services:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/deployment/services` | Create service |
| GET | `/deployment/services` | List services |
| PUT | `/deployment/services/:serviceId` | Update service |
| DELETE | `/deployment/services/:serviceId` | Delete service |

**Assignments:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/deployment/projects/:projectId/servers/:serverId` | Assign server to project |
| POST | `/deployment/users/:userId/services/:serviceId` | Assign service to user |
| DELETE | `/deployment/users/:userId/services/:serviceId` | Remove service from user |

### Notifications (NEW)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get user notifications (paginated) |
| GET | `/notifications/unread-count` | Get unread count for badge |
| PATCH | `/notifications/:id/read` | Mark single notification as read |
| PATCH | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Role-based dashboard data |

---

## 4. Notification System

### Email Notifications
Automatically sent for:

| Event | Email Template |
|-------|----------------|
| Task assigned | 📋 New Task Assigned |
| Task status changed | 🔄 Task Status Updated |
| Project invitation | 🏢 Project Invitation |
| New message in thread | 💬 New Message |
| Task due tomorrow | ⏰ Task Due Reminder |

### In-App Notifications

| Endpoint | Purpose |
|----------|---------|
| `GET /notifications` | Fetch all notifications |
| `GET /notifications/unread-count` | Bell badge count |
| `PATCH /notifications/:id/read` | Mark as read on click |
| `PATCH /notifications/read-all` | Mark all as read |

### Automated Reminders
- **Cron Job:** Runs daily at 9:00 AM
- **Purpose:** Sends email + in-app reminders for tasks due tomorrow
- **Recipients:** All assignees of the task

---

## 5. File Handling
- Project `user_manual` and task attachments uploaded via Multer (memory storage)
- Stored in Cloudinary, supports images, PDFs, Word docs (max 2MB)
- Metadata stored in PostgreSQL with synchronized deletion

---

## 6. Permission System

### System Roles
| Role | Permissions |
|------|-------------|
| `user` | Access assigned projects and tasks |
| `admin` | Create and manage own projects |
| `super_admin` | Full system access |

### Project Roles
| Role | Permissions |
|------|-------------|
| `project_admin` | Full project access (CRUD all) |
| `project_member` | Read/write access to tasks & discussions |
| `project_viewer` | Read-only access |

**Access Control:** RBAC with middleware + service-level validation for all operations

---

## 7. Validation & Error Handling
- **Zod** for request body, params, query validation
- Centralized error handler with custom `ApiError` and `ApiResponse` wrappers
- Consistent error response format

---

## 8. Database Schema (14 tables)

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `roles` | System and project roles |
| `projects` | Project details and metadata |
| `project_users` | Project membership and roles |
| `project_threads` | Discussion threads |
| `tasks` | Task management (project + thread based) |
| `task_assignees` | Task-user assignments |
| `messages` | Thread messages with replies |
| `attachments` | File references |
| `activity_logs` | Audit trail |

### Notification Tables
| Table | Purpose |
|-------|---------|
| `notifications` | In-app user notifications |
| `email_logs` | Email sending history |

### Deployment Tables
| Table | Purpose |
|-------|---------|
| `servers` | Deployment server details |
| `services` | Available services |
| `project_servers` | Server-project assignments |
| `user_services` | User-service access assignments |

### Relationships
Project
├── Threads → Messages → Replies
├── Tasks (direct)
├── Members (Users with roles)
├── Servers (deployment targets)
├── Notifications
└── Activity Logs

Task
├── Assignees (Users)
├── Attachments
└── Comments (via optional thread)

User
├── Assigned Tasks
├── Project Memberships
├── Notifications
└── Service Access


---

## 9. Deployment

| Component | Platform |
|-----------|----------|
| Backend | Render.com (port 10000) |
| Database | Neon PostgreSQL (serverless) |
| File Storage | Cloudinary |
| Email SMTP | Configurable (Mailtrap/Gmail/SendGrid) |

### Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
FRONTEND_URL=http://localhost:3000
10. Current Status
✅ Completed (100%)
Full authentication (JWT + refresh tokens)

User management with roles

Project CRUD with member management

Thread CRUD with status tracking

Dual task creation (project-based + thread-based)

Messaging system with nested replies

File uploads with Cloudinary

Role-based access control (RBAC)

Activity logging (full audit trail)

Dashboard with role-based data

Deployment & service tracking

Email notifications (5+ templates)

In-app notifications (bell icon, read/unread, pagination)

Automated task due reminders (daily cron job)

Soft delete support

Centralized error handling

Input validation (Zod)

🔄 Future Enhancements (Optional)
Real-time WebSocket notifications

Global search functionality

Export reports (CSV/PDF)

Bulk operations

Task dependencies

Swagger/OpenAPI documentation

Unit & integration tests

11. Key Strengths
Strength	Description
Clean Architecture	Feature-based modular structure
Comprehensive RBAC	System + Project level roles
Flexible Task Management	Tasks under projects OR threads
Dual Notification System	Email + In-app notifications
Automated Reminders	Daily cron job for due tasks
Cloud File Handling	Cloudinary integration
Full Audit Trail	Activity logging for all actions
Deployment Tracking	Server and service management
Optimized Database	Proper indexes and relations
12. Summary
Metric	Value
Status	✅ Production-ready
Version	2.0.0
API Endpoints	50+
Database Tables	14
Notification Types	5
Email Templates	5
System Roles	3
Project Roles	3
Cron Jobs	1 (task reminders)
Base URL: https://pms-l909.onrender.com/api/v1

Repository: GitHub - shoaib713343/PMS

13. Frontend Integration Notes
Notifications API Quick Reference
javascript
// Get unread count (for bell badge)
GET /api/v1/notifications/unread-count

// Get all notifications (paginated)
GET /api/v1/notifications?page=1&limit=20

// Mark as read
PATCH /api/v1/notifications/:id/read

// Mark all as read
PATCH /api/v1/notifications/read-all
Notification Types
Type	When triggered
task_assigned	User assigned to task
task_status_changed	Task status updated
project_invite	User invited to project
new_message	New message in thread
task_due_reminder	Task due tomorrow