import { AuthController } from '@controllers/auth.controller';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { checkAuth } from '@/middlewares/auth.middleware';
import passport from 'passport';

export class AuthRoute implements Routes {
  public path = '/api/auth';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/discord/login`, passport.authenticate('discord', { scope: ['identify'] }));
    this.router.get(`${this.path}/discord/callback`, passport.authenticate('discord', { failureRedirect: '/error-oauth' }), this.auth.callback);
    this.router.get(`${this.path}/logout`, checkAuth, this.auth.logout);
  }
}
