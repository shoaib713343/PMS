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
* Middleware for auth, validation, error handling

Ensures scalability and maintainability.

---

## 3. API Base Path

/api/v1

---

## 4. Implemented APIs

### Authentication

* POST /auth/login
* POST /auth/register

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

---

### Threads

Base:

* /projects/:projectId/threads

---

### Tasks

* POST /threads/:threadId/tasks
* GET /threads/:threadId/tasks
* GET /tasks/:taskId
* PATCH /tasks/:taskId
* DELETE /tasks/:taskId
* PATCH /tasks/:taskId/status

---

### Attachments (NEW)

#### Task Attachments

* POST /projects/:projectId/threads/:threadId/tasks/:taskId/attachments
* DELETE /attachments/:attachmentId

Features:

* Upload using Multer
* Stored in Cloudinary
* Metadata saved in PostgreSQL
* Synchronized deletion (Cloudinary + DB)

---

### Messaging

* Thread-based messaging
* Nested replies supported

---

## 5. File Handling System (NEW)

### 5.1 Project-Level File

* Field: user_manual
* Uploaded during project creation
* Stored in Cloudinary
* Used for documentation/specification

---

### 5.2 Task Attachments

* Multiple files per task
* Supports images and PDFs
* Stored in Cloudinary
* Linked via attachments table

---

### 5.3 File Validation

* MIME type validation (images + PDF)
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

* Role-based access implemented
* Middleware + service-level checks

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
* Handles validation and runtime errors

---

## 9. Database Overview

### Core Tables

* users
* roles
* projects
* project_users
* project_threads
* tasks
* messages
* attachments (NEW)

---

### Relationships

Project → Threads → Tasks → Attachments
Project → Threads → Messages → Replies

---

## 10. Deployment

* Backend deployed on Render
* PostgreSQL hosted on Neon
* Environment variables managed securely

---

## 11. Current Gaps / Pending Work

### Frontend Integration

* UI not yet implemented
* APIs ready for consumption

---

### Activity Logs

* Not implemented
* Future: audit tracking system

---

### Permission Optimization

* Currently mixed (service + middleware)
* Future: centralized RBAC middleware

---

## 12. Summary

The backend system is:

* Modular and scalable
* Fully functional for core workflows
* Production-ready for backend services

Key strengths:

* Clean architecture
* Role-based access control
* File handling with Cloudinary
* Robust error handling

Future scope includes:

* Frontend UI
* Activity tracking
* Advanced permission management

---
