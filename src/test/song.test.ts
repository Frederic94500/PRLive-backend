import { SongModel } from '@/models/song.model';
import { SongService } from '@/services/song.service';
import { UserModel } from '@/models/user.model';
import { VoteModel } from '@/models/vote.model';

jest.mock('../models/user.model.ts');
jest.mock('../models/vote.model.ts');
jest.mock('../models/song.model.ts');

describe('SongService', () => {
  let service: SongService;

  beforeEach(() => {
    service = new SongService();
  });

  it('should create a song if it does not exist', async () => {
    const songData = {
      url: 'testUrl',
      title: 'testTitle',
      artist: 'testArtist',
    };

    (SongModel.findOne as jest.Mock).mockResolvedValue(null);

    (SongModel.create as jest.Mock).mockResolvedValue(songData);

    await expect(service.createSong(songData)).resolves.not.toThrow();
  });

  it('should throw an error if song already exists', async () => {
    const songData = {
      url: 'testUrl',
      title: 'testTitle',
      artist: 'testArtist',
    };

    (SongModel.findOne as jest.Mock).mockResolvedValue(songData);

    await expect(service.createSong(songData)).rejects.toThrow(`This song ${songData.title} already exists`);
  });

  it('should return songs not voted by user', async () => {
    const discordId = 'testDiscordId';
    const user = { _id: 'userId' };
    const votes = [
      { userId: user._id, songId: 'songId1' },
      { userId: user._id, songId: 'songId2' },
    ];
    const songs = [{ _id: 'songId3' }, { _id: 'songId4' }];

    (UserModel.findOne as jest.Mock).mockResolvedValue(user);
    (VoteModel.find as jest.Mock).mockResolvedValue(votes);
    (SongModel.find as jest.Mock).mockResolvedValue(songs);

    const result = await service.getNotVotedSongByDiscordId(discordId);
    expect(result).toEqual(songs);
  });

  it('should delete a song by id', async () => {
    const songId = 'testSongId';
    const song = { _id: songId };

    (SongModel.findByIdAndDelete as jest.Mock).mockResolvedValue(song);

    await expect(service.deleteSong(songId)).resolves.not.toThrow();
  });

  it('should throw an error if song to delete does not exist', async () => {
    const songId = 'testSongId';

    (SongModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    await expect(service.deleteSong(songId)).rejects.toThrow(`Song doesn't exist`);
  });
});
