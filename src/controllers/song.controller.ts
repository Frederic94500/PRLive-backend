import { Request, Response } from 'express';

import { Container } from 'typedi';
import { Song } from '@/interfaces/song.interface';
import { SongService } from '@/services/song.service';
import { sendJSON } from './toolbox.controller';

export class SongController {
  public song = Container.get(SongService);

  public createSong = async (req: Request, res: Response) => {
    try {
      const songData: Song = req.body;
      await this.song.createSong(songData);

      sendJSON(res, 201, 'created');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getNotVotedSong = async (req: Request & { user: { id: string } }, res: Response) => {
    try {
      const discordId: string = req.user.id;
      const songs: Song[] = await this.song.getNotVotedSongByDiscordId(discordId);

      sendJSON(res, 200, songs);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getRandomSong = async (req: Request & { user: { id: string } }, res: Response) => {
    try {
      const discordId: string = req.user.id;
      const song: Song = await this.song.randomSong(discordId);

      sendJSON(res, 200, song);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getSongById = async (req: Request & { user: { id: string } }, res: Response) => {
    try {
      const songId: string = req.params.id;
      const discordId: string = req.user.id;
      const findSongData: Song = await this.song.findSongById(discordId, songId);

      sendJSON(res, 200, findSongData);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public deleteSong = async (req: Request, res: Response) => {
    try {
      const songId: string = req.params.id;
      await this.song.deleteSong(songId);

      sendJSON(res, 200, 'deleted');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };
}
