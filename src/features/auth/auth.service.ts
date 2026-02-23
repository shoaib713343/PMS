import bcrypt from "bcryptjs";
import { db } from "../../db";
import { users } from "../../db/schema/users";
import { eq } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { userSessions } from "../../db/schema";


type Register = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    systemRole: "admin" | "user" | "super_admin";
}

type Login = {
    email: string;
    password: string;
}

class AuthService{
    async registration(options: Register){
        const {firstName, lastName, email, password, systemRole} = options;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.insert(users).values({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            systemRole: systemRole
        }).returning({
            id: users.id,
            email: users.email,
            role: users.systemRole
        });

        return result[0];
    }

    async login(options: Login){
        const {email, password} = options;

        const result = await db.select().from(users).where(eq(users.email, email));

        if(result.length === 0){
            throw new ApiError(
                400,
                "User doesn't exists"
            )
        }

        const user = result[0];

        const isValid = await bcrypt.compare(password, user.password );

        if(!isValid){
            throw new ApiError(
                401,
                "Invalid email or password"
            ) 
        }

        const unHashedToken = crypto.randomBytes(64).toString("hex");
        const hashedRefreshToken = crypto.createHash('sha256').update(unHashedToken).digest("hex");

        const expiresAt = new Date;

        expiresAt.setDate(expiresAt.getDate() + 7)
        
        await db.insert(userSessions).values({
            userId: user.id,
            refreshToken: hashedRefreshToken,
            expiresAt
        })

        const payload = {
            id: user.id,
            email: user.email,
            role: user.systemRole
        }
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {expiresIn: process.env.JWT_EXPIRY!} as SignOptions);

        return {
            accessToken, unHashedToken, user: payload
        }

    }

    async refresh(token: string){
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const result = await db.select().from(userSessions).where(eq(userSessions.refreshToken, hashedToken));
        if(result.length === 0){
            throw new ApiError(401, 
                "Invalid refresh token"
            )
        }
        const session = result[0];

        if(session.isRevoked){
            throw new ApiError(401, "refreshToken revoked");
        }
        if(session.expiresAt< new Date()){
            throw new ApiError(401, "refreshToken is expired");
        }

        await db.update(userSessions).set({
            isRevoked: true
        }).where(eq(userSessions.id, session.id));

        const newRawToken = crypto.randomBytes(64).toString("hex");

        const newHashedToken = crypto.createHash("sha256").update(newRawToken).digest("hex");

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7)

        await db.insert(userSessions).values({
            userId: session.userId,
            refreshToken: newHashedToken,
            expiresAt
        })

        const [user] = await db.select().from(users).where(
            eq(
                users.id, session.userId
            )
        )

        const payload = {
            id: user.id,
            email: user.email,
            role: user.systemRole
        }

        const accessToken = await jwt.sign(
            payload, process.env.JWT_SECRET!, {
                expiresIn: process.env.JWT_EXPIRY!
            } as SignOptions
        )

        return {accessToken, newRawToken, newHashedToken}
    }
}

export const authService = new AuthService();