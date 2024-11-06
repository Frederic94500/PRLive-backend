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
}
