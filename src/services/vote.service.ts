import { HttpException } from '@/exceptions/httpException';
import { Service } from 'typedi';
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
}
