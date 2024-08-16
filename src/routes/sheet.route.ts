import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { SheetController } from '@/controllers/sheet.controller';
import { SheetDto } from '@/dtos/sheet.dto';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { checkAuth } from '@/middlewares/auth.middleware';

export class SheetRoute implements Routes {
  public path = '/api/sheet';
  public router = Router();
  public sheetController = new SheetController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:prId`, checkAuth, this.sheetController.getId);
    this.router.put(`${this.path}/:prId`, checkAuth, ValidationMiddleware(SheetDto), this.sheetController.editId);	
  }
}
