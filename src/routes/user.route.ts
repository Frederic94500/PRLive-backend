import { checkAdmin, checkAuth } from '@/middlewares/auth.middleware';

import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { UserController } from '@/controllers/user.controller';

export class UserRoute implements Routes {
  public path = '/api/user';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.delete(`${this.path}/delete/:id`, checkAdmin, this.user.deleteUser);
  }
}
