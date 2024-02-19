import { AverageVote, Vote } from '@/interfaces/vote.interface';

import { HttpException } from '@/exceptions/httpException';
import { Service } from 'typedi';
import { SongModel } from '@/models/song.model';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { VoteModel } from '@/models/vote.model';

@Service()
export class VoteService {
  public async castVote(voteData: Vote, discordId: string): Promise<void> {
    const findUser: User = await UserModel.findOne({ discordId });
    const findVote: Vote = await VoteModel.findOne({
      songId: voteData.songId,
      userId: findUser._id,
    });
    if (findVote) {
      throw new HttpException(409, `You have already voted for this song`);
    }

    voteData.userId = findUser._id;
    voteData.timestamp = new Date();

    await VoteModel.create(voteData);
  }

  public async getAverageVotes(): Promise<String> {
    const songs = await SongModel.find();
    const votes = await VoteModel.find();
    const sumScore: Record<string, { sum: number; count: number }> = {};

    songs.forEach(song => {
      sumScore[song._id] = { sum: 0, count: 0 };
    });

    votes.forEach(vote => {
      sumScore[vote.songId].sum += vote.score;
      sumScore[vote.songId].count++;
    });

    const averageVotes: AverageVote[] = [];
    songs.forEach(song => {
      averageVotes.push({
        artist: song.artist,
        title: song.title,
        average: sumScore[song._id].sum / sumScore[song._id].count,
        numberOfVotes: sumScore[song._id].count,
        url: song.url,
      });
    });

    return JSON.stringify(averageVotes);
  }
}
