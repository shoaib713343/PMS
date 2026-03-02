import {Request, Response, NextFunction} from "express";
import { ApiError } from "../utils/ApiError";
import { ZodError } from "zod";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

export function errorHandler(err:any, req: Request, res: Response, next: NextFunction){

    if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
      data: null,
    });
  }

    if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please login again.",
      errors: [],
      data: null,
    });
  }

    if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
      errors: [],
      data: null,
    });
  }

    if(err instanceof ApiError ){
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            data: null
        });
    }
    console.error("An unexpected error occured:", err);

    if(err.code === '23505'){
        return res.status(400).json({
            success: false,
            message: "Duplicate entry",
            errors: [],
            data: null
        });
    }

    if (err.code === "23505") {
    return res.status(400).json({
      success: false,
      message: "Invalid reference provided",
      errors: [],
      data: null,
    });
  }

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [],
        data: null
    });
}