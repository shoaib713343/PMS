// app.ts
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

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is up and running" });
});

// Mount routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/roles", rolesRouter);

// IMPORTANT: Mount these in order
app.use("/api/v1/projects", projectRouter);  // Handles /projects/:projectId/*
app.use("/api/v1/threads", threadRouter);    // Handles /threads/:threadId/*
app.use("/api/v1/tasks", taskRouter);        // Handles /tasks/* (direct)

app.use(errorHandler);

export default app;