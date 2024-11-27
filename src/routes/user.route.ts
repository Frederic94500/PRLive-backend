import { checkAdmin, checkAuth, checkCreator } from '@/middlewares/auth.middleware';

import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { UserController } from '@/controllers/user.controller';
import { UserDto } from '@/dtos/user.dto';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import rateLimiterImage from '@/ratelimiters/image.ratelimiter';
import upload from '@/services/multer.service';

export class UserRoute implements Routes {
  public path = '/api/user';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/get`, checkAuth, this.user.getUser);
    this.router.get(`${this.path}/get/:id`, this.user.getUserById);
    this.router.get(`${this.path}/gets`, checkCreator, this.user.getUsers);
    this.router.put(`${this.path}/edit`, checkAuth, ValidationMiddleware(UserDto), this.user.editUser);
    this.router.post(`${this.path}/imageupload`, checkAuth, rateLimiterImage, upload.single('image'), this.user.imageUpload);
    this.router.put(`${this.path}/imageupdate/:id`, checkAdmin, this.user.imageUpdateAdmin);
    this.router.delete(`${this.path}/delete/:id`, checkAdmin, this.user.deleteUser);
  }
}
