import { Request, Response } from "express";
import {authService} from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

export async function register(req: Request, res: Response) {
    const {firstName, lastName, mobileNo, email, password, systemRole} = req.body;
    const options = {
        firstName, lastName, mobileNo, email, password, systemRole
    }
    const user = await authService.registration(options);

    return res.status(201).json(
        new ApiResponse(
            201,
            "Registration Successfull",
            user
        )
    )
}

export async function login(req: Request, res: Response) {
    const {accessToken, unHashedToken, user} = await authService.login(req.body);
   res.cookie("refreshToken", unHashedToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
    return res.status(200).json(
        new ApiResponse(
            200,
            "Login Successfull",
            {accessToken, user}

        )
    )
}

export async function logout(req: Request, res: Response) {
    const refreshToken =  req.cookies?.refreshToken;
    if(!refreshToken){
        return res.json(
            new ApiResponse(200, "Logout Successfull")
        )
    }
    await authService.logout(refreshToken);

    res.clearCookie("refreshCookie", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    })
}

export async function refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken){
        throw new ApiError(401, "Missing refresh Token")
    }
    const {accessToken, newHashedToken, newRawToken} = await authService.refresh(req.cookies.refreshToken);
    res.cookie("refreshToken", newRawToken, {
        httpOnly: true,
        secure: process.env.node === "production",
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json(
        new ApiResponse(200, "Tokens refreshed" ,{accessToken})
    )
}
