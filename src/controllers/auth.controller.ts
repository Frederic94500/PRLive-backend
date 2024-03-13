import { Request, Response } from 'express';

import { AuthService } from '@services/auth.service';
import { Container } from 'typedi';
import { ORIGIN } from '@/config';
import { sendJSON } from '../utils/toolbox';

export class AuthController {
  public auth = Container.get(AuthService);

  public callback = async (req: Request & { user: { id: string; username: string } }, res: Response) => {
    try {
      this.auth.callback(req.user);
      res.redirect(ORIGIN);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public whoAmI = async (req: Request & { user: { id: string; username: string; avatar: string } }, res: Response) => {
    try {
      const id = req.user.id;
      const username = req.user.username;
      const avatar = req.user.avatar;
      sendJSON(res, 200, { id, username, avatar });
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
