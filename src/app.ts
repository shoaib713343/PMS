import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRouter from "./features/auth/auth.routes";
import projectRouter from "./features/projects/project.routes";
import userRouter from "./features/users/user.routes";
import rolesRouter from "./features/roles/role.routes";
import threadRouter from "./features/projectThreads/projectThread.routes";
import taskRouter from "./features/tasks/task.routes";
import dashboardRouter from "./features/dashboard/dashboard.route";
import deploymentRouter from "./features/deployment/deployment.routes";
import notificationRouter from "./features/notifications/notification.routes";
import { protect } from "./middleware/authMiddleware";
import { allowRoles } from "./middleware/rbac";
import { asyncHandler } from "./utils/asyncHandler";
import { triggerRemindersManuallyController } from "./features/taskReminder/taskReminder.controller";
import './jobs/taskReminder.job';

const app = express();

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is up and running" });
});

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// ADMIN TEST ENDPOINTS (for manual testing)
// ============================================
// Manually trigger task due reminders (admin only)
app.post(
  "/api/v1/admin/trigger-reminders", 
  protect, 
  allowRoles("admin", "super_admin"), 
  asyncHandler(triggerRemindersManuallyController)
);

// ============================================
// REGULAR API ROUTES
// ============================================

// AUTH ROUTES
app.use("/api/v1/auth", authRouter);

// DASHBOARD ROUTES
app.use("/api/v1/dashboard", dashboardRouter);

// USER & ROLE ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/roles", rolesRouter);

// TASK ROUTES 
app.use("/api/v1/tasks", taskRouter);

// PROJECT ROUTES - handles /api/v1/projects/:projectId/*
app.use("/api/v1/projects", projectRouter);

// THREAD ROUTES - handles /api/v1/threads/:threadId/*
app.use("/api/v1/threads", threadRouter);

// DEPLOYMENT ROUTES
app.use("/api/v1/deployment", deploymentRouter);

// NOTIFICATION ROUTES
app.use("/api/v1/notifications", notificationRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;