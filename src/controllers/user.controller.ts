import { Request, Response } from 'express';

import { Container } from 'typedi';
import { UserService } from '@services/user.service';
import { UserVote } from '@/interfaces/vote.interface';
import { sendJSON } from './toolbox.controller';

export class UserController {
  public user = Container.get(UserService);

  public getUsers = async (req: Request, res: Response) => {
    try {
      const usersVote: UserVote[] = await this.user.getUsers();

      sendJSON(res, 200, usersVote);
    } catch (error) {
      console.log(error);
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
