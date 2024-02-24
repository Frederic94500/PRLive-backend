import { Request, Response } from 'express';

import { AuthService } from '@services/auth.service';
import { Container } from 'typedi';
import { ORIGIN } from '@/config';
import { sendJSON } from '../utils/toolbox';

export class AuthController {
  public auth = Container.get(AuthService);

  public callback = async (req: Request, res: Response) => {
    try {
      this.auth.callback(req.user);
      res.redirect(ORIGIN);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public whoAmI = async (req: Request & { user: { username: string } }, res: Response) => {
    try {
      const username = req.user.username;
      sendJSON(res, 200, username);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public logout = async (req: Request, res: Response) => {
    res.clearCookie('connect.sid');
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect(ORIGIN);
      });
    });
  };
}
