import { Request, Response } from 'express';

import { Container } from 'typedi';
import { NominationService } from '@/services/nomination.service';
import { Song } from '@/interfaces/song.interface';
import { sendJSON } from '@/utils/toolbox';

export class NominationController {
  public nominationService = Container.get(NominationService);

  public getNomination = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prId = req.params.prId;
      const userId = req.user.id;
      const nomination = await this.nominationService.getNomination(prId, userId);
      
      sendJSON(res, 200, nomination);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public nominate = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prId = req.params.prId;
      const userId = req.user.id;
      const songData: Song = req.body;
      await this.nominationService.nominate(prId, userId, songData);
      
      sendJSON(res, 201, 'Nominated');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public getNominationSong = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prId = req.params.prId;
      const userId = req.user.id;
      const uuid = req.params.uuid;
      const song = await this.nominationService.getNominationSong(prId, userId, uuid);
      
      sendJSON(res, 200, song);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public editNomination = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prId = req.params.prId;
      const userId = req.user.id;
      const uuid = req.params.uuid;
      const songData: Song = req.body;
      await this.nominationService.editNomination(prId, userId, uuid, songData);
      
      sendJSON(res, 200, 'Nomination edited');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public deleteNomination = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prId = req.params.prId;
      const userId = req.user.id;
      const uuid = req.params.uuid;
      await this.nominationService.deleteNomination(prId, userId, uuid);
      
      sendJSON(res, 200, 'Nomination deleted');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public endNomination = async (req: Request, res: Response) => {
    try {
      const prId = req.params.prId;
      await this.nominationService.endNomination(prId);
      
      sendJSON(res, 200, 'Nomination ended');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }
}
