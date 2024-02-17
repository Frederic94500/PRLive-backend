import { NextFunction, Request, Response } from 'express';

import { UserModel } from '@/models/user.model';

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/api/auth/discord/login');
};

export const checkAdmin = async (req: Request & { user: { id: string } }, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    const user = await UserModel.findOne({ discordId: req.user.id });
    if (user.role === 'admin') {
      return next();
    }
  }
  res.status(403).json({ message: 'Forbidden' });
};
