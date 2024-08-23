import { HttpException } from '@exceptions/httpException';
import { Service } from 'typedi';
import { SheetModel } from '@/models/sheet.model';
import { User } from '@interfaces/user.interface';
import { UserModel } from '@/models/user.model';

@Service()
export class UserService {
  public async getUser(userId: string): Promise<User> {
    const findUser: User = await UserModel.findOne({ discordId: userId });
    if (!findUser) throw new HttpException(404, "User doesn't exist");

    return findUser;
  }

  public async editUser(userData: User, userId: string): Promise<User> {
    const updateUserById: User = await UserModel.findOneAndUpdate({ discordId: userId }, { name: userData.name, image: userData.image }, { new: true });
    if (!updateUserById) throw new HttpException(404, "User doesn't exist");

    return updateUserById;
  }

  public async deleteUser(userId: string): Promise<void> {
    const deleteUserById: User = await UserModel.findByIdAndDelete(userId);
    if (!deleteUserById) throw new HttpException(404, "User doesn't exist");

    await SheetModel.deleteMany({ voterId: userId });
  }
}
