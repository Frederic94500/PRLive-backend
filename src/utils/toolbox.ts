import { Response } from 'express';

export function sendJSON(res: Response, code: number, data: any) {
  res.status(code).json({ code: code, data: data });
}
