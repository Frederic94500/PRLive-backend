import { Request, Response } from 'express';

import { Container } from "typedi";
import { PR } from "@/interfaces/pr.interface";
import { PRService } from "@/services/pr.service";
import { sendJSON } from "@/utils/toolbox";

export class PRController {
    public prService = Container.get(PRService);

    public createPR = async (req: Request, res: Response) => {
        try {
            const prData: PR = req.body;
            await this.prService.createPR(prData);

            sendJSON(res, 201, 'created');
        } catch (error) {
            sendJSON(res, error.status, error.message);
        }
    };

    public output = async (req: Request, res: Response) => {
        try {
            const prId: string = req.params.id;
            const pr: PR = await this.prService.output(prId);

            sendJSON(res, 200, pr);
        } catch (error) {
            sendJSON(res, error.status, error.message);
        }
    };
}