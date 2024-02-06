import { HttpException } from '@/exceptions/httpException';
import { Service } from 'typedi';
import { Song } from '@/interfaces/song.interface';
import { SongModel } from '@/models/song.model';

@Service()
export class SongService {
  public async createSong(songData: Song): Promise<void> {
    const findSong: Song = await SongModel.findOne({ url: songData.url });
    if (findSong) {
      throw new HttpException(409, `This song ${songData.title} already exists`);
    }

    await SongModel.create(songData);
  }

  public async randomSong(): Promise<Song> {
    const findAllSongData: Song[] = await SongModel.find();
    const randomSong: Song = findAllSongData[Math.floor(Math.random() * findAllSongData.length)];
    if (!randomSong) {
      throw new HttpException(404, `Song doesn't exist`);
    }

    return randomSong;
  }

  public async findSongById(songId: string): Promise<Song> {
    const findSong: Song = await SongModel.findById(songId);
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
