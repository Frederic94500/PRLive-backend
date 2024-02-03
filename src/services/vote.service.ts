import { HttpException } from '@/exceptions/httpException';
import { Service } from 'typedi';
import { SongModel } from '@/models/song.model';
import { Vote } from '@/interfaces/vote.interface';
import { VoteModel } from '@/models/vote.model';

@Service()
export class VoteService {
  public async castVote(voteData: Vote): Promise<void> {
    const findVote: Vote = await VoteModel.findOne({
      songId: voteData.songId,
      userId: voteData.userId,
    });
    if (findVote) {
      throw new HttpException(409, `You have already voted for this song`);
    }

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

    const averageVotes: Record<string, number> = {};
    songs.forEach(song => {
      averageVotes[song._id] = sumScore[song._id].sum / sumScore[song._id].count;
    });

    return JSON.stringify(averageVotes);
  }
}
