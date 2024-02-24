import { NextFunction, Request, Response } from 'express';

import { UserModel } from '@/models/user.model';
import { sendJSON } from 'utils/toolbox';

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    sendJSON(res, 403, 'Forbidden');
  }
};

export const checkAdmin = async (req: Request & { user: { id: string } }, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    const user = await UserModel.findOne({ discordId: req.user.id });
    if (user.role === 'admin') {
      return next();
    }
  }
  sendJSON(res, 403, 'Forbidden');
};
