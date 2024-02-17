import { Request, Response } from 'express';

import Container from 'typedi';
import { Vote } from '@/interfaces/vote.interface';
import { VoteService } from '@/services/vote.service';
import { sendJSON } from '../utils/toolbox';

export class VoteController {
  public vote = Container.get(VoteService);

  public castVote = async (req: Request, res: Response) => {
    try {
      const voteData: Vote = req.body;
      await this.vote.castVote(voteData);

      sendJSON(res, 201, 'created');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getAverageVotes = async (req: Request, res: Response) => {
    try {
      const averageVotes: String = await this.vote.getAverageVotes();

      sendJSON(res, 200, averageVotes);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };
}
