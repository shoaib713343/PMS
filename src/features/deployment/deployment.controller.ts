import { Request, Response } from "express";
import { serverService } from "./server.service";
import { serviceManagementService } from "./service.service";
import { ApiResponse } from "../../utils/ApiResponse";

export async function createServerController(req: Request, res: Response) {
  const server = await serverService.createServer(req.body, req.user!);
  return res.status(201).json(new ApiResponse(201, "Server created", server));
}

export async function listServersController(req: Request, res: Response) {
  const servers = await serverService.listServers();
  return res.status(200).json(new ApiResponse(200, "Servers fetched", servers));
}

export async function assignServerToProjectController(req: Request, res: Response) {
  const { projectId, serverId } = req.params;
  const assignment = await serverService.assignServerToProject(
    Number(projectId), 
    Number(serverId), 
    req.user!
  );
  return res.status(200).json(new ApiResponse(200, "Server assigned to project", assignment));
}

// Service Controllers
export async function createServiceController(req: Request, res: Response) {
  const service = await serviceManagementService.createService(req.body, req.user!);
  return res.status(201).json(new ApiResponse(201, "Service created", service));
}

export async function listServicesController(req: Request, res: Response) {
  const services = await serviceManagementService.listServices();
  return res.status(200).json(new ApiResponse(200, "Services fetched", services));
}

export async function assignServiceToUserController(req: Request, res: Response) {
  const { userId, serviceId } = req.params;
  const { accessLevel } = req.body;
  const assignment = await serviceManagementService.assignServiceToUser(
    Number(userId), 
    Number(serviceId), 
    accessLevel,
    req.user!.id
  );
  return res.status(200).json(new ApiResponse(200, "Service assigned to user", assignment));
}