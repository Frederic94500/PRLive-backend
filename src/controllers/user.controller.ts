import { Request, Response } from 'express';

import { Container } from 'typedi';
import { UserService } from '@services/user.service';
import { sendJSON } from '../utils/toolbox';

export class UserController {
  public user = Container.get(UserService);

  public deleteUser = async (req: Request, res: Response) => {
    try {
      const userId: string = req.params.id;
      await this.user.deleteUser(userId);

      sendJSON(res, 200, 'deleted');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };
}
