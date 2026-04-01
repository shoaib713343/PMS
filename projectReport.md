# Project Management System (PMS) Backend – Technical Report

---

## 1. Overview

The backend system supports core project management workflows including:

* Project creation and management
* User-role assignment within projects
* Thread (issue/discussion) handling
* Task management within threads
* Messaging system with replies
* File handling (attachments + project documents)

The system is built using:

* Node.js
* Express.js
* TypeScript
* PostgreSQL (Neon)
* Drizzle ORM
* Cloudinary (file storage)

---

## 2. Application Structure

Feature-based modular architecture:

* Controllers → Services → Database
* Middleware for authentication, validation, and error handling

Ensures scalability, maintainability, and clean separation of concerns.

---

## 3. API Base Path

/api/v1

---

## 4. Implemented APIs

### Authentication

* POST /auth/register
* POST /auth/login
* POST /auth/refresh
* POST /auth/logout

Features:

* JWT-based authentication
* Refresh token rotation
* Secure cookie handling

---

### Projects

* POST /projects → Create project (with optional user manual file)
* GET /projects → List projects
* GET /projects/:projectId → Get project details
* PUT /projects/:projectId → Update project
* DELETE /projects/:projectId → Delete project

#### Project Members

* POST /projects/:projectId/members
* DELETE /projects/:projectId/members/:userId

Features:

* Creator-based ownership logic
* Project-level role assignment
* Validation to prevent invalid or duplicate assignments

---

### Threads

Base:

* /projects/:projectId/threads

Features:

* Thread creation and retrieval
* Acts as a container for tasks and messages

---

### Tasks

* POST /threads/:threadId/tasks
* GET /threads/:threadId/tasks
* GET /tasks/:taskId
* PATCH /tasks/:taskId
* PATCH /tasks/:taskId/status
* DELETE /tasks/:taskId

Features:

* Task assignment to project members
* Status management (pending → in_progress → completed)
* Validation to ensure assigned users belong to the project
* Soft deletion support

---

### Messaging

* POST /threads/:threadId/messages
* POST /threads/:threadId/messages/:messageId/replies
* GET /threads/:threadId/messages

Features:

* Thread-based messaging system
* Nested replies using parent-child relationship
* Replies linked via parentId
* Structured response with grouped replies

---

### Attachments

#### Task Attachments

* POST /projects/:projectId/threads/:threadId/tasks/:taskId/attachments
* DELETE /attachments/:attachmentId

Features:

* File upload using Multer (memory storage)
* Cloudinary integration for storage
* Supports images and PDFs
* Metadata stored in PostgreSQL
* Synchronized deletion (Cloudinary + DB)

---

## 5. File Handling System

### 5.1 Project-Level File

* Field: user_manual
* Uploaded during project creation
* Stored in Cloudinary

---

### 5.2 Task Attachments

* Multiple files per task
* Linked via attachments table
* Stored in Cloudinary

---

### 5.3 File Validation

* MIME type validation
* File size restriction
* Secure upload handling

---

## 6. Permission System

### System Roles

* user
* admin
* super_admin

### Project Roles

* project_admin
* member roles

### Access Control

* Role-based access control implemented
* Combination of middleware and service-level validation
* Permissions enforced for:
  * Project operations
  * Task operations
  * Messaging access

---

## 7. Validation

* Implemented using Zod
* Covers:

  * Request body
  * Params
  * Query validation

---

## 8. Error Handling

* Centralized error handler
* Custom ApiError & ApiResponse
* Handles:

  * Validation errors
  * JWT errors
  * Database errors

---

## 9. Database Overview

### Core Tables

* users
* roles
* projects
* project_users
* project_threads
* tasks
* task_assignees
* messages
* attachments

---

### Relationships

Project → Threads → Tasks → Attachments  
Project → Threads → Messages → Replies  

---

## 10. Deployment

* Backend deployed on Render
* PostgreSQL hosted on Neon
* Cloudinary for file storage
* Environment variables managed securely

---

## 11. Current Status

### Completed

* Core backend fully functional
* Authentication with JWT + refresh tokens
* Project, thread, and task workflows
* Messaging system with replies
* File uploads and attachments
* Role-based access control
* Input validation and error handling

---

### Partially Completed

* Permission handling (partially centralized, still mixed)
* Thread module (basic functionality stable, limited enhancements)

---

### Pending / Future Improvements

* Frontend integration (APIs ready)
* Activity logs / audit tracking
* Centralized permission system
* Advanced validation and security enhancements
* Automated testing (unit/integration)

---

## 12. Summary

The backend system is:

* Fully functional for core workflows
* Modular and scalable in design
* Stable for integration with frontend

Key strengths:

* Clean architecture
* Role-based access control
* Optimized database usage (reduced redundant queries)
* Cloud-based file handling (Cloudinary)
* Structured messaging system with replies

The system is ready for frontend integration and further enhancement.

---