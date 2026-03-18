# Project Management System (PMS) Backend – Technical Report

---

## 1. Overview

The backend system supports core project management workflows including:

* Project creation and management
* User-role assignment within projects
* Thread (issue/discussion) handling
* Task management within threads

The system is built using:

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Drizzle ORM

---

## 2. Application Structure

```
src/
 ├── db/
 │   ├── schema/
 │   └── index.ts
 │
 ├── features/
 │   ├── auth/
 │   ├── users/
 │   ├── roles/
 │   ├── projects/
 │   ├── projectThreads/
 │   └── tasks/
 │
 ├── middleware/
 ├── utils/
 └── app.ts
```

The architecture follows a feature-based modular structure.

---

## 3. API Base Path

```
/api/v1
```

---

## 4. Implemented APIs

### 4.1 Authentication

* POST `/auth/login`
* POST `/auth/register`

---

### 4.2 Users

* GET `/users`
* GET `/users/:id`

---

### 4.3 Roles

* POST `/roles`
* GET `/roles`

---

### 4.4 Projects

* POST `/project` → Create project
* GET `/project` → List projects
* GET `/project/:projectId` → Get project details
* PUT `/project/:projectId` → Update project
* DELETE `/project/:projectId` → Delete project

Project Members:

* POST `/project/:projectId/members`
* DELETE `/project/:projectId/members/:userId`

---

### 4.5 Threads (Project-Level)

Base Path:

```
/project/:projectId/threads
```

Routes:

* POST `/` → Create thread
* GET `/` → List threads
* GET `/:threadId` → Get thread
* PATCH `/:threadId` → Update thread
* DELETE `/:threadId` → Delete thread
* PATCH `/:threadId/status` → Update status

---

### 4.6 Tasks

* POST `/threads/:threadId/tasks` → Create task
* GET `/threads/:threadId/tasks` → List tasks
* GET `/tasks/:taskId` → Get task
* PATCH `/tasks/:taskId` → Update task
* DELETE `/tasks/:taskId` → Delete task
* PATCH `/tasks/:taskId/status` → Update status

---

## 5. Functional Modules

### 5.1 Project Management

* Project creation and updates
* User assignment to projects
* Role assignment per project

---

### 5.2 Thread Management

* Threads created within projects
* Supports updates and soft deletion
* Status updates available

Threads represent:

* Issues
* Discussions
* Feature requests

---

### 5.3 Task Management

* Tasks linked to threads
* Supports update and soft deletion
* Status management implemented

Tasks represent actionable work items.

---

## 6. Permission System

### 6.1 System-Level Roles

* user
* admin
* super_admin

---

### 6.2 Project-Level Roles

* project_admin
* other roles (e.g., developer, tester)

---

### 6.3 Access Control

#### Threads

* admin / super_admin → full access
* project members → create and view
* project_admin → full control

#### Tasks

* admin / super_admin → full access
* project_admin → create/update/delete
* other members → limited access

---

## 7. Validation

* Implemented using Zod
* Covers:

  * Request body validation
  * Route parameter validation

---

## 8. Error Handling

* Centralized error handler implemented
* Error structure includes:

  * message
  * status code
  * validation details

---

## 9. Database Overview

### Core Tables

* users
* roles
* projects
* project_users
* project_threads
* tasks

### Relationships

```
Project → Threads → Tasks  
Project → ProjectUsers → Roles
```

### Additional Entities (from ERD)

According to the ERD (page 1) :

* Message & Reply (not yet implemented in backend)
* Attachment system (linked via ActiveStorage)
* Server & Project detail tables
* User-service mapping

---

## 10. Current Gaps / Pending Work

The following features are not yet implemented:

### 10.1 Messaging System

* Thread messages
* Replies

---

### 10.2 Attachments

* File upload support
* Attachment linking

---

### 10.3 Activity Tracking

* No audit logs for:

  * create/update/delete actions

---

### 10.4 Task Ordering

* No ordering mechanism (e.g., drag-and-drop)

---

### 10.6 Permission Handling

* Permission checks are implemented but not centralized

---

## 11. Technical Notes

* Soft delete implemented using `isDeleted`
* Status fields stored as numeric values
* Date handling requires proper formatting before DB insertion

---

## 12. Summary

The backend currently supports:

* Project lifecycle management
* Role-based access control
* Thread and task workflows

The system is modular and can be extended with:

* Messaging
* Attachments
* Activity tracking

---
