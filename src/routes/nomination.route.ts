import { checkAuth, checkCreator } from "@/middlewares/auth.middleware";

import { NominateDto } from "@/dtos/nominate.dto";
import { NominationController } from "@/controllers/nomination.controller";
import { Router } from "express";
import { Routes } from "@/interfaces/routes.interface";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";

export class NominationRoute implements Routes {
  public path = '/api/nomination';
  public router = Router();
  public nominationController = new NominationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/get/:prId`, checkAuth, this.nominationController.getNomination);
    this.router.post(`${this.path}/nominate/:prId`, checkAuth, ValidationMiddleware(NominateDto), this.nominationController.nominate);
    this.router.get(`${this.path}/getnomination/:prId/:uuid`, checkAuth, this.nominationController.getNominationSong);
    this.router.put(`${this.path}/editnomination/:prId/:uuid`, checkAuth, ValidationMiddleware(NominateDto), this.nominationController.editNomination);
    this.router.delete(`${this.path}/deletenomination/:prId/:uuid`, checkAuth, this.nominationController.deleteNomination);
    this.router.put(`${this.path}/endnomination/:prId`, checkCreator, this.nominationController.endNomination);
  }
}