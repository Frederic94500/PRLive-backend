import { downloadFile, sendToS3 } from '@/utils/toolbox';

import { HttpException } from '@exceptions/httpException';
import { ServerEnum } from '@/enums/server.enum';
import { Service } from 'typedi';
import { SheetModel } from '@/models/sheet.model';
import { User } from '@interfaces/user.interface';
import { User as UserDiscord } from 'discord.js';
import { UserModel } from '@/models/user.model';
import client from './discord.service';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class UserService {
  public async getUser(userId: string): Promise<User> {
    const findUser: User = await UserModel.findOne({ discordId: userId });
    if (!findUser) throw new HttpException(404, "User doesn't exist");

    return findUser;
  }

  public async getUsers(): Promise<User[]> {
    const users: User[] = await UserModel.find();
    return users;
  }

  public async editUser(userData: User, userId: string, admin: boolean = false): Promise<User> {
    const args: { name: string; image: string; server: ServerEnum; role?: string } = { name: userData.name, image: userData.image, server: userData.server || ServerEnum.EU }
    if (admin) {
      args.role = userData.role;
    }
    const updateUserById: User = await UserModel.findOneAndUpdate(
      { discordId: userId },
      args,
      { new: true },
    );
    if (!updateUserById) throw new HttpException(404, "User doesn't exist");

    return updateUserById;
  }

  public async imageUpload(image: Express.Multer.File, userId: string): Promise<string> {
    if (!image) {
      throw new HttpException(400, 'No image provided');
    }
    if (image.mimetype !== 'image/jpeg' && image.mimetype !== 'image/png' && image.mimetype !== 'image/gif' && image.mimetype !== 'image/webp') {
      throw new HttpException(400, 'Invalid image type');
    }
    if (image.size > 3000000) {
      throw new HttpException(400, 'Image too large');
    }

    image.filename = `${uuidv4()}.${image.mimetype.split('/')[1]}`;
    const key = `${userId}/${image.filename}`;

    return sendToS3(key, image.mimetype, image.buffer);
  }

  public async imageUpdate(discordId: string): Promise<void> {
    const user = await UserModel.findOne({ discordId });
    if (!user) throw new HttpException(404, "User doesn't exist");

    let discordUser: UserDiscord;
    try {
      discordUser = await client.users.fetch(discordId);
      if (!discordUser) throw new HttpException(404, 'Discord user not found');
    } catch (error) {
      throw new HttpException(500, 'Discord user fetch failed');
    }

    const imageUrl = discordUser.avatarURL({ extension: 'png' });
    const imageBuffer = await downloadFile(imageUrl);
    const filename = `${uuidv4()}.png`;
    user.image = await sendToS3(`${discordId}/${filename}`, 'image/png', imageBuffer);
    await user.save();
  }

  public async deleteUser(userId: string): Promise<void> {
    const deleteUserById: User = await UserModel.findOneAndDelete({ discordId: userId });
    if (!deleteUserById) throw new HttpException(404, "User doesn't exist");

    await SheetModel.deleteMany({ voterId: userId });
  }
}
