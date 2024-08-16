import { checkAdmin, checkAuth } from '@/middlewares/auth.middleware';

import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { UserController } from '@/controllers/user.controller';
import { UserDto } from '@/dtos/user.dto';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class UserRoute implements Routes {
  public path = '/api/user';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/get`, checkAuth, this.user.getUser);
    this.router.put(`${this.path}/edit`, checkAuth, ValidationMiddleware(UserDto), this.user.editUser);
    this.router.delete(`${this.path}/delete/:id`, checkAdmin, this.user.deleteUser);
  }
}
