import { NextFunction, Request, Response } from 'express';

import Container from 'typedi';
import { Vote } from '@/interfaces/vote.interface';
import { VoteService } from '@/services/vote.service';

export class VoteController {
  public vote = Container.get(VoteService);

  public castVote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const voteData: Vote = req.body;
      await this.vote.castVote(voteData);

      res.status(201).json({ message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public getAverageVotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const averageVotes: String = await this.vote.getAverageVotes();

      res.status(200).json({ data: averageVotes });
    } catch (error) {
      next(error);
    }
  };
}
