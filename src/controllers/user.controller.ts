import { Request, Response } from 'express';

import { Container } from 'typedi';
import { UserService } from '@services/user.service';
import { sendJSON } from '../utils/toolbox';

export class UserController {
  public user = Container.get(UserService);

  public getUser = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const user = await this.user.getUser(req.user.id);

      sendJSON(res, 200, user);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getUserById = async (req: Request, res: Response) => {
    try {
      const userId: string = req.params.id;
      const user = await this.user.getUser(userId);

      sendJSON(res, 200, user);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.user.getUsers();

      sendJSON(res, 200, users);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public editUser = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const userData = req.body;
      await this.user.editUser(userData, req.user.id);

      sendJSON(res, 200, 'edited');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public imageUpload = async (req: Request & { user: { id: string }} & { file: Express.Multer.File }, res: Response) => {
    try {
      const image = req.file;
      const url = await this.user.imageUpload(image, req.user.id);

      sendJSON(res, 200, url);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }
  
  public imageUpdateAdmin = async (req: Request, res: Response) => {
    try {
      const userId: string = req.params.id;
      await this.user.imageUpdateAdmin(userId);

      sendJSON(res, 200, 'Photo profile updated');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

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
