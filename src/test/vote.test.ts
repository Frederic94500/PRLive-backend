import { SongModel } from '@/models/song.model';
import { UserModel } from '@/models/user.model';
import { VoteModel } from '@/models/vote.model';
import { VoteService } from '@/services/vote.service';

jest.mock('../models/user.model');
jest.mock('../models/song.model');
jest.mock('../models/vote.model');

describe('VoteService', () => {
  let service: VoteService;

  beforeEach(() => {
    service = new VoteService();
  });

  it('should cast a vote', async () => {
    const userId = 'userId';
    const timestamp = new Date();
    const voteData = { userId, songId: 'songId', score: 5, timestamp };
    const discordId = 'discordId';
    const user = { _id: 'userId' };
    const song = { _id: 'songId' };

    (UserModel.findOne as jest.Mock).mockResolvedValue(user);
    (SongModel.findOne as jest.Mock).mockResolvedValue(song);
    (VoteModel.findOne as jest.Mock).mockResolvedValue(null);
    (VoteModel.create as jest.Mock).mockResolvedValue({});

    await expect(service.castVote(voteData, discordId)).resolves.not.toThrow();
  });

  it('should calculate average votes', async () => {
    const songs = [{ _id: 'songId1', artist: 'artist1', title: 'title1', url: 'url1' }];
    const votes = [
      { songId: 'songId1', score: 5 },
      { songId: 'songId1', score: 4 },
    ];

    (SongModel.find as jest.Mock).mockResolvedValue(songs);
    (VoteModel.find as jest.Mock).mockResolvedValue(votes);

    const result = await service.getAverageVotes();
    expect(result).toEqual(JSON.stringify([{ artist: 'artist1', title: 'title1', average: 4.5, nbVotes: 2, url: 'url1' }]));
  });
});
