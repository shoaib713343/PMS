import { ApiResponse } from "../../utils/ApiResponse";
import { userService } from "./user.service"
import { Request, Response } from "express"

export async function createUserController(req: Request, res: Response) {
    const {firstName, lastName, mobileNo, email, password} = req.body;
    const options = {
        firstName, lastName, mobileNo, email, password
    }
    const user = await userService.createUser(options);

    return res.json(
        new ApiResponse(201, "User Created Successfully")
    )
}

export const updateUserController = async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id.toString(), req.body);

  res.status(200).json(
    new ApiResponse(
    200,
    "User Updated Successfully",
    user,
    )
  );
};

export const getUserController = async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id.toString());

  res.status(200).json(
    new ApiResponse(
        200,
        "User Fetched Successfully",
        user
    )
  )
};

export const listUsersController = async (_: Request, res: Response) => {
  const users = await userService.listUsers();

  res.status(200).json(
    new ApiResponse(
        200,
        "UserList Fetched Successfully",
        users
    )
  )
};

export const deleteUserController = async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id.toString());

    res.status(200).json(
        new ApiResponse(
            200,
            "User deleted Successfully"
        )
    )
}