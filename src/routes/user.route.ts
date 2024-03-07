import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { UserController } from '@/controllers/user.controller';
import { checkAdmin } from '@/middlewares/auth.middleware';

export class UserRoute implements Routes {
  public path = '/api/user';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/getusers`, this.user.getUsers);
    this.router.delete(`${this.path}/delete/:id`, checkAdmin, this.user.deleteUser);
  }
}
