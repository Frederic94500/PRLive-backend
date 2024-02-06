import { NextFunction, Request, Response } from 'express';

import { Container } from 'typedi';
import { Song } from '@/interfaces/song.interface';
import { SongService } from '@/services/song.service';

export class SongController {
  public song = Container.get(SongService);

  public createSong = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const songData: Song = req.body;
      await this.song.createSong(songData);

      res.status(201).json({ message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public getSong = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const song: Song = await this.song.randomSong();

      res.status(200).json({ data: song });
    } catch (error) {
      next(error);
    }
  };

  public getSongById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const songId: string = req.params.id;
      const findSongData: Song = await this.song.findSongById(songId);

      res.status(200).json({ data: findSongData });
    } catch (error) {
      next(error);
    }
  };

  public deleteSong = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const songId: string = req.params.id;
      await this.song.deleteSong(songId);

      res.status(200).json({ message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
