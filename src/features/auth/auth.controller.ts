import { Request, Response } from "express";
import {authService} from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

export async function register(req: Request, res: Response) {
    const {firstName, lastName, email, password, systemRole} = req.body;
    const options = {
        firstName, lastName, email, password, systemRole
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
    const {accessToken, refreshToken, user} = await authService.login(req.body);
   res.cookie("refreshToken", refreshToken, {
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

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    })
}

export async function refresh(req: Request, res: Response) {
    const token = req.cookies.refreshToken;
    if(!token){
        throw new ApiError(401, "Missing refresh Token")
    }
    const {accessToken, refreshToken} = await authService.refresh(token);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.node === "production",
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json(
        new ApiResponse(200, "Tokens refreshed" ,{accessToken})
    )
}
