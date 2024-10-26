import { NextFunction, Request, Response } from 'express';

import { Role } from '@/enums/role.enum';
import { UserModel } from '@/models/user.model';
import { sendJSON } from 'utils/toolbox';

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    sendJSON(res, 401, undefined);
  }
};

export const checkAuthNonMandatory = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return next();
  }
}

export const checkAdmin = async (req: Request & { user: { id: string } }, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    const user = await UserModel.findOne({ discordId: req.user.id });
    if (user.role === Role.ADMIN) {
      return next();
    }
  }
  sendJSON(res, 403, undefined);
};

export const checkCreator = async (req: Request & { user: { id: string } }, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    const user = await UserModel.findOne({ discordId: req.user.id });
    if (user.role === Role.CREATOR || user.role === Role.ADMIN) {
      return next();
    }
  }
  sendJSON(res, 403, undefined);
};
