import { NextFunction, Request, Response } from 'express';

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/api/auth/discord/login');
};
