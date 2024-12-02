import { downloadFile, sendToS3 } from '@/utils/toolbox';

import { HttpException } from '@/exceptions/httpException';
import { Role } from '@/enums/role.enum';
import { Server } from '@/enums/server.enum';
import { Service } from 'typedi';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class AuthService {
  public async uploadAvatar(reqUser: { id: string; avatar: string }): Promise<string> {
    let image = `https://cdn.discordapp.com/avatars/${reqUser.id}/${reqUser.avatar}.png`;
    const response = await fetch(image);
    if (response.ok) {
      const imageBuffer = await downloadFile(image);
      const filename = `${uuidv4()}.png`;
      const key = `${reqUser.id}/${filename}`;
      image = await sendToS3(key, 'image/png', imageBuffer);
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
        role: Role.USER,
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
