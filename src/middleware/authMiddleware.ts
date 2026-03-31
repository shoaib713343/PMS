import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";

type UserType = typeof users.$inferSelect;

declare global {
    namespace Express {
        interface Request {
            user?: Omit<UserType, 'password'>;
        }
    }
}

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
  const decoded = jwt.verify(token, secret) as {id: number };

  if(!decoded.id){
    throw new ApiError(401, 'Unauthorized: Invalid token');
  }
  const user = await db.select().from(users).where(eq(users.id, decoded.id));
  if(user.length === 0){
    throw new ApiError(401, 'Unauthorized: User for this token no longer exists');
  }
const {password: _, ...userWithoutPassword} = user[0];
req.user = userWithoutPassword;
next();


}

export const protect = asyncHandler(protectLogic);