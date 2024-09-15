import { HttpException } from '@/exceptions/httpException';
import { Service } from 'typedi';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';

@Service()
export class AuthService {
  public async callback(reqUser: { id: string; username: string, avatar: string }): Promise<void> {
    const findUser: User = await UserModel.findOne({ discordId: reqUser.id });
    if (!findUser) {
      const user: User = {
        discordId: reqUser.id,
        username: reqUser.username,
        name: reqUser.username.charAt(0).toUpperCase() + reqUser.username.slice(1),
        image: `https://cdn.discordapp.com/avatars/${reqUser.id}/${reqUser.avatar}.png`,
        role: 'user',
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
