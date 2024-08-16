import { Request, Response } from 'express';

import Container from "typedi";
import { Sheet } from "@/interfaces/sheet.interface";
import { SheetService } from "@/services/sheet.service";
import { sendJSON } from "@/utils/toolbox";

export class SheetController {
  public sheetService = Container.get(SheetService);
  
  public getId = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const prId: string = req.params.prId;
      const userId: string = req.user.id;
      const sheet = await this.sheetService.getId(prId, userId);
      
      sendJSON(res, 200, sheet);
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };

  public editId = async (req: Request & { user: { id: string }}, res: Response) => {
    try {
      const sheetData: Sheet = req.body;
      const prId: string = req.params.prId;
      const userId: string = req.user.id;
      await this.sheetService.editId(sheetData, prId, userId);
      
      sendJSON(res, 200, 'edited');
    } catch (error) {
      sendJSON(res, error.status, error.message);
    }
  };
}
