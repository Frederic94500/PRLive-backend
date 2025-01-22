import { checkAdmin, checkAuth, checkCreator } from '@/middlewares/auth.middleware';

import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { SheetController } from '@/controllers/sheet.controller';
import { SheetDto } from '@/dtos/sheet.dto';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class SheetRoute implements Routes {
  public path = '/api/sheet';
  public router = Router();
  public sheetController = new SheetController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/gets`, checkAuth, this.sheetController.gets);
    this.router.get(`${this.path}/:prId`, checkAuth, this.sheetController.getId);
    this.router.put(`${this.path}/:prId`, checkAuth, ValidationMiddleware(SheetDto), this.sheetController.editId);
    this.router.get(`${this.path}/:prId/:voterId/:sheetId`, this.sheetController.getSheetNoAuth);
    this.router.put(`${this.path}/:prId/:voterId/:sheetId`, ValidationMiddleware(SheetDto), this.sheetController.editSheetNoAuth);
    this.router.get(`${this.path}/:prId/:voterId`, checkCreator, this.sheetController.getSheetVoter);
    this.router.delete(`${this.path}/delete/:prId`, checkAuth, this.sheetController.deleteSheetUser);
    this.router.delete(`${this.path}/delete/:prId/:voterId`, checkCreator, this.sheetController.deleteSheetVoter);
    this.router.delete(`${this.path}/delete/:prId/:voterId/:sheetId`, this.sheetController.deleteSheetNoAuth);
  }
}
