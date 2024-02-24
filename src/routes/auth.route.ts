import { AuthController } from '@controllers/auth.controller';
import { ORIGIN } from '@/config';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import passport from 'passport';
import { whoAmI } from '@/middlewares/auth.middleware';

export class AuthRoute implements Routes {
  public path = '/api/auth';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/discord/login`, passport.authenticate('discord', { scope: ['identify'] }));
    this.router.get(`${this.path}/discord/callback`, passport.authenticate('discord', { failureRedirect: ORIGIN }), this.auth.callback);
    this.router.get(`${this.path}/whoami`, whoAmI);
    this.router.get(`${this.path}/logout`, this.auth.logout);
  }
}
