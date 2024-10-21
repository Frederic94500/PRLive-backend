import { AWS_S3_BUCKET_NAME, AWS_S3_STATIC_PAGE_URL } from '@/config';

import { HttpException } from '@/exceptions/httpException';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Server } from '@/enums/server.enum';
import { Service } from 'typedi';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import fs from 'fs';
import path from 'path';
import s3Client from './aws.service';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class AuthService {
  public async uploadAvatar(reqUser: { id: string; avatar: string }): Promise<string> {
    let image = `https://cdn.discordapp.com/avatars/${reqUser.id}/${reqUser.avatar}.png`;
    const response = await fetch(image);
    if (response.ok) {
      const filename = `${uuidv4()}.png`;
      const filePath = path.join(__dirname, 'downloads', filename);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const writer = fs.createWriteStream(filePath);
      Readable.fromWeb(response.body).pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const fileStream = fs.createReadStream(filePath);
      const params = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: `${reqUser.id}/${filename}`,
        Body: fileStream,
        ContentType: 'image/png',
      };
      await s3Client.send(new PutObjectCommand(params));

      fs.unlinkSync(filePath);
      writer.close();
      fileStream.close();

      image = AWS_S3_STATIC_PAGE_URL + `/${reqUser.id}/${filename}`;
    }

    return image;
  }

  public async callback(reqUser: { id: string; username: string, avatar: string }): Promise<void> {
    const findUser: User = await UserModel.findOne({ discordId: reqUser.id });
    if (!findUser) {
      const image = await this.uploadAvatar(reqUser);

      const user: User = {
        discordId: reqUser.id,
        username: reqUser.username,
        name: reqUser.username.charAt(0).toUpperCase() + reqUser.username.slice(1),
        image: image,
        role: 'user',
        server: Server.EU,
      };
      
      await UserModel.create(user);
    }
  }

  public async whoAmI(reqUser: string): Promise<User> {
    const user: User = await UserModel.findOne({ discordId: reqUser }, { _id: 0, __v: 0 });
    if (!user) {
      throw new HttpException(404, 'User not found');
    }
    
    return user;
  }
}
