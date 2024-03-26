import { UVote, UserVote, Vote } from '@/interfaces/vote.interface';

import { HttpException } from '@exceptions/httpException';
import { Service } from 'typedi';
import { Song } from '@/interfaces/song.interface';
import { SongModel } from '@/models/song.model';
import { User } from '@interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { VoteModel } from '@/models/vote.model';

@Service()
export class UserService {
  public async getUsers(): Promise<UserVote[]> {
    const users: User[] = await UserModel.find();
    const votes: Vote[] = await VoteModel.find();
    const songs: Song[] = await SongModel.find();
    const sumVotes: Record<string, { countVote: number; avgVote: number; votes: UVote[] }> = {};

    users.forEach(user => {
      sumVotes[user._id] = { countVote: 0, avgVote: 0, votes: [] };
    });

    votes.forEach(vote => {
      sumVotes[vote.userId].countVote++;
      sumVotes[vote.userId].avgVote += vote.score;
      sumVotes[vote.userId].votes.push({
        artist: songs.find(song => song._id.toString() === vote.songId).artist,
        title: songs.find(song => song._id.toString() === vote.songId).title,
        score: vote.score,
      });
    });

    const usersVote: UserVote[] = [];
    users.forEach(user => {
      usersVote.push({
        username: user.username,
        countVote: sumVotes[user._id].countVote,
        avgVote: sumVotes[user._id].avgVote / sumVotes[user._id].countVote,
        votes: sumVotes[user._id].votes,
      });
    });

    return usersVote;
  }

  public async deleteUser(userId: string): Promise<void> {
    const deleteUserById: User = await UserModel.findByIdAndDelete(userId);
    if (!deleteUserById) throw new HttpException(404, "User doesn't exist");

    await VoteModel.deleteMany({ userId });
  }
}
