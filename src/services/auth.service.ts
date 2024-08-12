import { Service } from 'typedi';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';

@Service()
export class AuthService {
  public async callback(reqUser: { id: string; username: string, avatar: string }): Promise<void> {
    const user: User = {
      discordId: reqUser.id,
      username: reqUser.username,
      name: reqUser.username,
      image: `https://cdn.discordapp.com/avatars/${reqUser.id}/${reqUser.avatar}.png`,
      role: 'user',
    };

    const findUser: User = await UserModel.findOne({ discordId: user.discordId });
    if (!findUser) {
      await UserModel.create(user);
    }
  }
}
