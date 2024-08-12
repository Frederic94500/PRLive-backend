import { PR, PROutput } from '@/interfaces/pr.interface';
import { Request, Response } from 'express';

import { Container } from 'typedi';
import { PRService } from '@/services/pr.service';
import { sendJSON } from '@/utils/toolbox';

export class PRController {
  public prService = Container.get(PRService);

  public createPR = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prData: PR = req.body;
      await this.prService.createPR(prData, req.user.id);

      sendJSON(res, 201, 'created');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public output = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.id;
      const pr: PROutput = await this.prService.output(prId);

      sendJSON(res, 200, pr);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public gets = async (req: Request, res: Response) => {
    try {
      const prs: PR[] = await this.prService.getPRs();

      sendJSON(res, 200, prs);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };
}
