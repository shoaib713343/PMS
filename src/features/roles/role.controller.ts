import { Request, Response } from "express";
import { roleService } from "./role.service";
import { ApiResponse } from "../../utils/ApiResponse";

export async function createRoleController(req: Request, res: Response){
    const role = await roleService.createRoles(req.body.name);

    return res.status(201).json(
        new ApiResponse(
            201,
            "Role created successfully",
            role
        )
    )
}

export async function listRolesController(req: Request, res: Response){
    const roles = await roleService.listRoles();

    return res.status(200).json(
        new ApiResponse(
            200,
            "RoleList fetched successfully",
            roles
        )
    )
}

export async function listRoleByIdController(req: Request, res: Response){
    const role = await roleService.rolesById(Number(req.params.id));

    return res.status(200).json(
        new ApiResponse(
            200,
            "Role Fetched successfully",
            role
        )
    )
}

export async function updateRoleController(req: Request, res: Response){
    const role = await roleService.updateRole(Number(req.params.id), req.body.name);

    return res.status(200).json(
        new ApiResponse(200, "role updated successfully", role)
    )
}

export async function deleteRoleController(req: Request, res: Response){
    await roleService.deleteRole(Number(req.params.id.toString));

    return res.status(200).json(
        new ApiResponse(200, 
            "role deleted successfully"
        )
    )
}
