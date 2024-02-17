import { Request, Response } from 'express';

import { Container } from 'typedi';
import { User } from '@interfaces/user.interface';
import { UserService } from '@services/user.service';
import { sendJSON } from './toolbox.controller';

export class UserController {
  public user = Container.get(UserService);

  public getUsers = async (req: Request, res: Response) => {
    try {
      const findAllUsersData: User[] = await this.user.findAllUser();

      sendJSON(res, 200, findAllUsersData);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

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
