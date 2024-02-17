import { checkAdmin, checkAuth } from '@/middlewares/auth.middleware';

import { CreateSongDto } from '@/dtos/song.dto';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { SongController } from '@controllers/song.controller';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class SongRoute implements Routes {
  public path = '/api/song';
  public router = Router();
  public song = new SongController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create`, checkAdmin, ValidationMiddleware(CreateSongDto), this.song.createSong);
    this.router.get(`${this.path}/getnotvoted`, checkAuth, this.song.getNotVotedSong);
    this.router.get(`${this.path}/get`, checkAuth, this.song.getRandomSong);
    this.router.get(`${this.path}/get/:id`, checkAuth, this.song.getSongById);
    this.router.delete(`${this.path}/delete/:id`, checkAdmin, this.song.deleteSong);
  }
}
