import { NominationController } from "@/controllers/nomination.controller";
import { Router } from "express";
import { Routes } from "@/interfaces/routes.interface";
import { checkAuth } from "@/middlewares/auth.middleware";

export class NominationRoute implements Routes {
  public path = '/api/nomination';
  public router = Router();
  public nominationController = new NominationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:prId`, checkAuth, this.nominationController.getNomination);
    this.router.post(`${this.path}/nominate/:prId`, checkAuth, this.nominationController.nominate);
  }
}