import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";

type AuthUser = {
    id: number;
    email: string;
    name: string;           // Keep for backward compatibility
    firstName: string;      // Add for email system
    lastName: string;       // Add for email system
    systemRole: "admin" | "user" | "super_admin";
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

type JwtPayload = {
    id: number;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    systemRole: "admin" | "user" | "super_admin";
};

async function protectLogic(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization;

    let token;
    if(authHeader && authHeader.startsWith("Bearer ")){
        token = authHeader.split(" ")[1];
    }
    if(!token){
        throw new ApiError(401, "Unauthorized: No token provided");
    }
    const secret = process.env.JWT_SECRET!;
    if (!secret) {
        throw new ApiError(500, 'Internal server error: JWT secret is not configured');
    }
    
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if(!decoded.id){
        throw new ApiError(401, 'Unauthorized: Invalid token');
    }
    
    const user = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        systemRole: users.systemRole
    }).from(users).where(eq(users.id, decoded.id));
    
    if(user.length === 0){
        throw new ApiError(401, 'Unauthorized: User for this token no longer exists');
    }

    // BACKWARD COMPATIBLE: Add 'name' field for frontend
    req.user = {
        id: user[0].id,
        email: user[0].email,
        name: `${user[0].firstName} ${user[0].lastName}`,  // Combined for frontend
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        systemRole: user[0].systemRole
    };
    next();
}

export const protect = asyncHandler(protectLogic);