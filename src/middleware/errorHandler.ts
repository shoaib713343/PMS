import {Request, Response, NextFunction} from "express";
import { ApiError } from "../utils/ApiError";

export function errorHandler(err:any, req: Request, res: Response, next: NextFunction){
    if(err instanceof ApiError ){
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            data: null
        });
    }
    console.error("An unexpected error occured:", err);

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [],
        data: null
    });
}