import { CreateVoteDto } from '@/dtos/vote.dto';
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { VoteController } from '@/controllers/vote.controller';
import { checkAdmin } from '@/middlewares/auth.middleware';

export class VoteRoute implements Routes {
  public path = '/api/vote';
  public router = Router();
  public voteController = new VoteController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/cast`, checkAdmin, ValidationMiddleware(CreateVoteDto), this.voteController.castVote);
    this.router.get(`${this.path}/avg`, this.voteController.getAverageVotes);
  }
}
