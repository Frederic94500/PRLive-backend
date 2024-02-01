import { HttpException } from '@/exceptions/httpException';
import { Service } from 'typedi';
import { Song } from '@/interfaces/song.interface';
import { SongModel } from '@/models/song.model';

@Service()
export class SongService {
  public async createSong(songData: Song): Promise<Song> {
    const findSong: Song = await SongModel.findOne({ url: songData.url });
    if (findSong) throw new HttpException(409, `This song ${songData.title} already exists`);

    const createSongData: Song = await SongModel.create(songData);

    return createSongData;
  }

  public async deleteSong(songId: string): Promise<Song> {
    const deleteSongById: Song = await SongModel.findByIdAndDelete(songId);
    if (!deleteSongById) throw new HttpException(404, `Song doesn't exist`);

    return deleteSongById;
  }
}
