import { checkAdmin, checkCreator } from "@/middlewares/auth.middleware";

import { Router } from "express";
import { Routes } from "@/interfaces/routes.interface";
import { ServerController } from "@/controllers/server.controller";
import { ServerDto } from "@/dtos/server.dto";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";

export class ServerRoute implements Routes {
  public path = '/api/server';
  public router = Router();
  public serverController = new ServerController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create`, checkAdmin, ValidationMiddleware(ServerDto), this.serverController.createServer);
    this.router.get(`${this.path}/get/:id`, checkCreator, this.serverController.getServer);
    this.router.get(`${this.path}/gets`, checkCreator, this.serverController.getServers);
    this.router.put(`${this.path}/edit/:id`, checkAdmin, ValidationMiddleware(ServerDto), this.serverController.editServer);
    this.router.delete(`${this.path}/delete/:id`, checkAdmin, this.serverController.deleteServer);
  }
}
