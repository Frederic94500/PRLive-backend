import { Request, Response } from 'express';

import Container from 'typedi';
import { Sheet } from '@/interfaces/sheet.interface';
import { SheetService } from '@/services/sheet.service';
import { sendJSON } from '@/utils/toolbox';

export class SheetController {
  public sheetService = Container.get(SheetService);

  public gets = async (req: Request & { user: { id: string } }, res: Response) => {
    try {
      const userId: string = req.user.id;
      const sheets = await this.sheetService.gets(userId);

      sendJSON(res, 200, sheets);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getId = async (req: Request & { user: { id: string } }, res: Response) => {
    try {
      const prId: string = req.params.prId;
      const userId: string = req.user.id;
      const sheet = await this.sheetService.getId(prId, userId);

      sendJSON(res, 200, sheet);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public editId = async (req: Request & { user: { id: string } }, res: Response) => {
    try {
      const sheetData: Sheet = req.body;
      const prId: string = req.params.prId;
      const userId: string = req.user.id;
      await this.sheetService.editId(sheetData, prId, userId);

      sendJSON(res, 200, 'Edited');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public getSheetVoter = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.prId;
      const voterId: string = req.params.voterId;
      const sheet = await this.sheetService.getSheetUser(prId, voterId);

      sendJSON(res, 200, sheet);
    } catch (error) {
      sendJSON(res, error.status, error);
    }
  };

  public deleteSheetUser = async (req: Request & { user: { id: string } }, res: Response) => {
    try {
      const prId: string = req.params.prId;
      const userId: string = req.user.id;
      await this.sheetService.deleteSheetUser(prId, userId);

      sendJSON(res, 200, 'Deleted');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  }

  public deleteSheetVoter = async (req: Request, res: Response) => {
    try {
      const prId: string = req.params.prId;
      const voterId: string = req.params.voterId;
      await this.sheetService.deleteSheetUser(prId, voterId);

      sendJSON(res, 200, 'Deleted');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };
}
