import { Request, Response } from 'express';

import { AuthService } from '@services/auth.service';
import { Container } from 'typedi';
import { sendJSON } from './toolbox.controller';

export class AuthController {
  public auth = Container.get(AuthService);

  public callback = async (req: Request, res: Response) => {
    try {
      this.auth.callback(req.user);
      sendJSON(res, 200, 'Logged in');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public logout = async (req: Request, res: Response) => {
    req.logout;
    res.redirect('/api/auth/discord/login');
  };
}
