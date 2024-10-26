import { AddSongPRDto, CreatePRDto, TiebreakDto, UpdatePRDto } from '@/dtos/pr.dto';
import { checkAuth, checkAuthNonMandatory, checkCreator } from '@/middlewares/auth.middleware';

import { PRController } from '@/controllers/pr.controller';
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import rateLimiterFile from '@/ratelimiters/file.ratelimiter';
import upload from '@/services/multer.service';

export class PRRoute implements Routes {
  public path = '/api/pr';
  public router = Router();
  public prController = new PRController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create`, checkCreator, ValidationMiddleware(CreatePRDto), this.prController.createPR);
    this.router.post(`${this.path}/addsong/:id`, checkCreator, ValidationMiddleware(AddSongPRDto),this.prController.addSongPR);
    this.router.delete(`${this.path}/deletesong/:id/:uuid`, checkCreator, this.prController.deleteSongPR);
    this.router.post(`${this.path}/uploadfile/:id/`, checkCreator, rateLimiterFile, upload.single('file'), this.prController.uploadFilePR);
    this.router.put(`${this.path}/update/:id`, checkCreator, ValidationMiddleware(UpdatePRDto), this.prController.updatePR);
    this.router.get(`${this.path}/tie/:id`, checkCreator, this.prController.getTie);
    this.router.put(`${this.path}/tiebreak/:id`, checkAuth, ValidationMiddleware(TiebreakDto), this.prController.tiebreak);
    this.router.get(`${this.path}/output/:id`, checkCreator, this.prController.output);
    this.router.get(`${this.path}/finished/:id`, checkAuthNonMandatory, this.prController.finished);
    this.router.delete(`${this.path}/delete/:id`, checkCreator, this.prController.deletePR);
    this.router.get(`${this.path}/get/:id`, checkAuth, this.prController.getPR);
    this.router.get(`${this.path}/gets`, checkCreator, this.prController.gets);
    this.router.get(`${this.path}/getsimple`, this.prController.getSimple);
  }
}
