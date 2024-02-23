import { HttpException } from '@/exceptions/httpException';
import { Service } from 'typedi';
import { Song } from '@/interfaces/song.interface';
import { SongModel } from '@/models/song.model';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { Vote } from '@/interfaces/vote.interface';
import { VoteModel } from '@/models/vote.model';

@Service()
export class SongService {
  public async createSong(songData: Song): Promise<void> {
    const findSong: Song = await SongModel.findOne({ url: songData.url });
    if (findSong) {
      throw new HttpException(409, `This song ${songData.title} already exists`);
    }

    await SongModel.create(songData);
  }

  public async getNotVotedSongByDiscordId(discordId: string): Promise<Song[]> {
    const user: User = await UserModel.findOne({ discordId });
    const findAllUserVote: Vote[] = await VoteModel.find({ userId: user._id });
    const findAllSongNotVoted: Song[] = await SongModel.find({ _id: { $nin: findAllUserVote.map(vote => vote.songId) } });

    if (findAllSongNotVoted.length === 0) {
      return [];
    }

    return findAllSongNotVoted;
  }

  public async randomSong(discordId: string): Promise<Song> {
    const findAllSongNotVoted: Song[] = await this.getNotVotedSongByDiscordId(discordId);
    const randomSong: Song = findAllSongNotVoted[Math.floor(Math.random() * findAllSongNotVoted.length)];
    if (!randomSong) {
      throw new HttpException(404, `Song doesn't exist`);
    }

    return randomSong;
  }

  public async findSongById(discordId: string, songId: string): Promise<Song> {
    const findAllSongNotVoted: Song[] = await this.getNotVotedSongByDiscordId(discordId);
    const findSong: Song = findAllSongNotVoted.find(song => song._id === songId);
    if (!findSong) {
      throw new HttpException(404, `Song doesn't exist`);
    }

    return findSong;
  }

  public async deleteSong(songId: string): Promise<void> {
    const deleteSongById: Song = await SongModel.findByIdAndDelete(songId);
    if (!deleteSongById) {
      throw new HttpException(404, `Song doesn't exist`);
    }
  }
}
