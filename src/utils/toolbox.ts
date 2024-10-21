import { HttpException } from '@/exceptions/httpException';
import { PR } from '@/interfaces/pr.interface';
import { Response } from 'express';
import { Sheet } from '@/interfaces/sheet.interface';
import { createHash } from 'crypto';

export function sendJSON(res: Response, code: number, data: any) {
  try {
    res.status(code).json({ code: code, data: data });
  } catch (error) {
    res.status(500).json({ code: 500, data: 'Internal server error: ' + error });
  }
}

export function hashKey(data: PR | Sheet) {
  let hashKey = ``;
  if ('songList' in data) {
    data.songList.forEach((song) => {
      hashKey += song.uuid + song.orderId;
    });
  } else if ('sheet' in data) {
    data.sheet.forEach((song) => {
      hashKey += song.uuid + song.orderId;
    });
  } else {
    throw new HttpException(400, 'Invalid data');
  }
  
  return createHash('sha256').update(hashKey).digest('hex');
}
