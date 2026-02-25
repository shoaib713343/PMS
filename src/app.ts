import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRouter from "./features/auth/auth.routes";
import projectRouter from "./features/projects/project.routes";
import userRouter from "./features/users/user.routes";
import rolesRouter from "./features/roles/role.routes";
import path from "path";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",  
      "http://localhost:5173", 
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/images", express.static(path.join(process.cwd(), "public/images")))

app.get("/", (req, res)=>{
    res.status(200).json({
        message: "Server is up and running"
    })
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/roles", rolesRouter);

app.use(errorHandler);

export default app;