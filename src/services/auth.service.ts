import { Service } from 'typedi';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';

@Service()
export class AuthService {
  public async callback(reqUser): Promise<void> {
    const user: User = {
      discordId: reqUser.id,
      username: reqUser.username,
    };

    const findUser: User = await UserModel.findOne({ discordId: user.discordId });
    if (!findUser) {
      await UserModel.create(user);
    }
  }
}
