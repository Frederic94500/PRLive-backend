import { AWS_S3_BUCKET_NAME, AWS_S3_STATIC_PAGE_URL } from '@/config';

import { HttpException } from '@/exceptions/httpException';
import { PR } from '@/interfaces/pr.interface';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Response } from 'express';
import { Sheet } from '@/interfaces/sheet.interface';
import { amqpService } from '@/services/amqp.service';
import { createHash } from 'crypto';
import s3Client from '@/services/aws.service';
import { v4 as uuidv4 } from 'uuid';

export function sendJSON(res: Response, code: number, data: any) {
  try {
    res.status(code).json({ code: code, data: data });
  } catch (error) {
    res.status(500).json({ code: 500, data: 'Internal server error: ' + error });
  }
}

export function hashKey(data: PR | Sheet): string {
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

export async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } else {
      throw new HttpException(400, 'Invalid URL');
    }
}

export async function sendToS3(key: string, contentType: string, data: Buffer): Promise<string> {
  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Body: data,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return AWS_S3_STATIC_PAGE_URL + `/${key}`;
  } catch (error) {
    throw new HttpException(500, 'Image upload failed');
  }
}

export async function uploadAvatar(id: string, avatar: string): Promise<string> {
  let image = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
  const response = await fetch(image);
  if (response.ok) {
    const imageBuffer = await downloadFile(image);
    const filename = `${uuidv4()}.png`;
    const key = `${id}/${filename}`;
    image = await sendToS3(key, 'image/png', imageBuffer);
  }

  return image;
}

export async function askToUploadAudio(urlVideo: string, key: string, uuid: string): Promise<void> {
  const payload = {
    url: urlVideo,
    folder: key,
    uuid: uuid,
  }
  try {
    amqpService.publish(JSON.stringify(payload));
  } catch (error) {
    console.log(error);
  }
}
