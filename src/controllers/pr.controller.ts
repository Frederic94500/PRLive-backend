import { PR, PROutput } from '@/interfaces/pr.interface';
import { Request, Response } from 'express';

import { Container } from 'typedi';
import { PRService } from '@/services/pr.service';
import { Song } from '@/interfaces/song.interface';
import { sendJSON } from '@/utils/toolbox';

export class PRController {
  public prService = Container.get(PRService);

  public createPR = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prData: PR = req.body;
      await this.prService.createPR(prData, req.user.id);

      sendJSON(res, 201, 'Created');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getPR = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.id;
      const pr: PR = await this.prService.getPR(prId);

      sendJSON(res, 200, pr);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public addSongPR = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.id;
      const songData: Song = req.body;
      await this.prService.addSongPR(prId, songData);

      sendJSON(res, 201, 'Added');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public updatePR = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.id;
      const prData: PR = req.body;
      await this.prService.updatePR(prId, prData);

      sendJSON(res, 200, 'Updated');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public output = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.id;
      const pr: PROutput = await this.prService.output(prId);

      sendJSON(res, 200, pr);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public deletePR = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.id;
      await this.prService.deletePR(prId);

      sendJSON(res, 200, 'Deleted');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public getDetail = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.id;
      const pr: PROutput = await this.prService.output(prId);

      sendJSON(res, 200, pr);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public gets = async (req: Request, res: Response) => {
    try {
      const prs: PR[] = await this.prService.getPRs();

      sendJSON(res, 200, prs);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getSimple = async (req: Request, res: Response) => {
    try {
      const prs: PR[] = await this.prService.getSimple();

      sendJSON(res, 200, prs);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };
}
