import { PR, PROutput } from '@/interfaces/pr.interface';

import { HttpException } from '@/exceptions/httpException';
import { PRModel } from '@/models/pr.model';
import { Service } from 'typedi';
import { Sheet } from '@/interfaces/sheet.interface';
import { SheetModel } from '@/models/sheet.model';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { hashKey } from '@/utils/toolbox';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class PRService {
  public async createPR(prData: PR, creatorId: string): Promise<void> {
    prData.songList = prData.songList.map((song, index) => {
      song.uuid = uuidv4();
      song.orderId = index;
      return song;
    });
    prData.finished = false;
    prData.creator = creatorId;
    prData.hashKey = hashKey(prData);
    await PRModel.create(prData);
  }

  public async output(prId: string): Promise<PROutput> {
    const pr: PR = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    const sheets: Sheet[] = await SheetModel.find({ prId });
    if (sheets.length === 0) {
      throw new HttpException(404, `No sheets found for PR ${pr.name}`);
    }

    const users: User[] = await UserModel.find();
    if (users.length === 0) {
      throw new HttpException(404, `No users found`);
    }

    const prOutput: PROutput = {
      name: pr.name,
      creator: pr.creator,
      nomination: pr.nomination,
      blind: pr.blind,
      deadline: pr.deadline,
      songList: pr.songList.map(song => {
        return {
          uuid: song.uuid,
          orderId: song.orderId,
          nominatedId: song.nominatedId,
          artist: song.artist,
          title: song.title,
          anime: song.anime,
          type: song.type,
          startSample: song.startSample,
          sampleLength: song.sampleLength,
          urlVideo: song.urlVideo,
          urlAudio: song.urlAudio,
          voters: sheets.map(sheet => {
            const voter = users.find(user => user._id === sheet.voterId);
            const sheetSong = sheet.sheet.find(sheetSong => sheetSong.uuid === song.uuid);
            return {
              name: voter.name,
              rank: sheetSong.rank,
            };
        })
      }})
    };

    return prOutput;
  }

  public async getPRs(): Promise<PR[]> {
    const prs: PR[] = await PRModel.find();
    return prs;
  }
}
