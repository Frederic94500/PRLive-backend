import { NextFunction, Request, Response } from 'express';

import { AuthService } from '@services/auth.service';
import { Container } from 'typedi';

export class AuthController {
  public auth = Container.get(AuthService);

  public callback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.auth.callback(req.user);
      res.redirect('/vote');
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response) => {
    req.logout;
    res.redirect('/api/auth/discord/login');
  };
}
