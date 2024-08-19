import { AddSongPRDto, CreatePRDto, UpdatePRDto } from '@/dtos/pr.dto';

import { PRController } from '@/controllers/pr.controller';
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { checkCreator } from '@/middlewares/auth.middleware';

export class PRRoute implements Routes {
  public path = '/api/pr';
  public router = Router();
  public prController = new PRController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create`, checkCreator, ValidationMiddleware(CreatePRDto), this.prController.createPR);
    this.router.post(`${this.path}/addsong/:id`, checkCreator, ValidationMiddleware(AddSongPRDto),this.prController.addSongPR);
    this.router.put(`${this.path}/update/:id`, checkCreator, ValidationMiddleware(UpdatePRDto), this.prController.updatePR);
    this.router.get(`${this.path}/output/:id`, checkCreator, this.prController.output);
    this.router.delete(`${this.path}/delete/:id`, checkCreator, this.prController.deletePR);
    this.router.get(`${this.path}/get/:id`, checkCreator, this.prController.getPR);
    this.router.get(`${this.path}/gets`, checkCreator, this.prController.gets);
    this.router.get(`${this.path}/getsimple`, this.prController.getSimple);
  }
}
