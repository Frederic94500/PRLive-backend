import { PR } from '@/interfaces/pr.interface';
import { Response } from 'express';
import { createHash } from 'crypto';

export function sendJSON(res: Response, code: number, data: any) {
  res.status(code).json({ code: code, data: data });
}

export function hashKey(prData: PR) {
  let hashKey = `${prData.creator}`;
  prData.songList.forEach((song) => {
    hashKey += song.uuid + song.orderId;
  });
  return createHash('sha256').update(hashKey).digest('hex');
}
