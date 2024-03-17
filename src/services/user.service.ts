import { UserVote, Vote } from '@/interfaces/vote.interface';

import { HttpException } from '@exceptions/httpException';
import { Service } from 'typedi';
import { User } from '@interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { VoteModel } from '@/models/vote.model';

@Service()
export class UserService {
  public async getUsers(): Promise<UserVote[]> {
    const users: User[] = await UserModel.find();
    const votes: Vote[] = await VoteModel.find();
    const sumVotes: Record<string, { countVote: number; avgVote: number }> = {};

    users.forEach(user => {
      sumVotes[user._id] = { countVote: 0, avgVote: 0 };
    });

    votes.forEach(vote => {
      sumVotes[vote.userId].countVote++;
      sumVotes[vote.userId].avgVote += vote.score;
    });

    const usersVote: UserVote[] = [];
    users.forEach(user => {
      usersVote.push({
        username: user.username,
        countVote: sumVotes[user._id].countVote,
        avgVote: sumVotes[user._id].avgVote / sumVotes[user._id].countVote,
      });
    });

    return usersVote;
  }

  public async deleteUser(userId: string): Promise<User> {
    const deleteUserById: User = await UserModel.findByIdAndDelete(userId);
    if (!deleteUserById) throw new HttpException(404, "User doesn't exist");

    return deleteUserById;
  }
}
