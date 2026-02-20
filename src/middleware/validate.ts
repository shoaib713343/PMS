import { Request, Response, NextFunction } from "express";
import {z, ZodError} from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: z.Schema) => {
   return (req: Request, res: Response, next: NextFunction) => {
        try{
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error){
            if(error instanceof ZodError) {
                const validationErrors = error.issues.map(err=> ({
                    path: err.path.join('.'),
                    message: err.message
                }));
                next(new ApiError(400, "Validation failed", validationErrors));
            } else {
                next(error);
            }
        }
    }
}