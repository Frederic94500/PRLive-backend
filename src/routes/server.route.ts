import { Router } from "express";
import { Routes } from "@/interfaces/routes.interface";
import { ServerController } from "@/controllers/server.controller";
import { ServerDto } from "@/dtos/server.dto";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { checkAdmin } from "@/middlewares/auth.middleware";

export class ServerRoute implements Routes {
  public path = '/api/server';
  public router = Router();
  public serverController = new ServerController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create`, checkAdmin, ValidationMiddleware(ServerDto), this.serverController.createServer);
    this.router.get(`${this.path}/get/:id`, this.serverController.getServer);
    this.router.get(`${this.path}/gets`, checkAdmin, this.serverController.getServers);
    this.router.put(`${this.path}/edit/:id`, checkAdmin, ValidationMiddleware(ServerDto), this.serverController.editServer);
    this.router.delete(`${this.path}/delete/:id`, checkAdmin, this.serverController.deleteServer);
  }
}
