import { CreateSongDto } from '@/dtos/song.dto';
import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { SongController } from '@controllers/song.controller';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

export class SongRoute implements Routes {
  public path = '/song';
  public router = Router();
  public song = new SongController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/create`, ValidationMiddleware(CreateSongDto), this.song.createSong);
    this.router.delete(`${this.path}/delete/:id`, this.song.deleteSong);
  }
}
