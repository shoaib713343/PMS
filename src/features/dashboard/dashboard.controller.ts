import { Request, Response } from "express";
import { getDashboardData } from "./dashboard.service";

export const getDashboardController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const systemRole = req.user?.systemRole!;

  const data = await getDashboardData(Number(userId), systemRole);

  return res.json({
    success: true,
    data,
  });
};