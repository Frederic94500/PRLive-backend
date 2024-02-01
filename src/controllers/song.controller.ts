import { NextFunction, Request, Response } from 'express';

import { Container } from 'typedi';
import { Song } from '@/interfaces/song.interface';
import { SongService } from '@/services/song.service';

export class SongController {
  public song = Container.get(SongService);

  public createSong = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const songData: Song = req.body;
      const createSongData: Song = await this.song.createSong(songData);

      res.status(201).json({ data: createSongData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public deleteSong = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const songId: string = req.params.id;
      const deleteSongData: Song = await this.song.deleteSong(songId);

      res.status(200).json({ data: deleteSongData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
