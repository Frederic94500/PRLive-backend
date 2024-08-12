import { CreatePRDto } from '@/dtos/pr.dto';
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
    this.router.get(`${this.path}/output/:id`, checkCreator, this.prController.output);
    this.router.get(`${this.path}/gets`, this.prController.gets);
  }
}
