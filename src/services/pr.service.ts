import { AnisongDb, Song } from '@/interfaces/song.interface';
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
import { writeFile } from 'fs';

@Service()
export class PRService {
  private parseAnisongDb(anisongDb: AnisongDb[]): Song[] {
    return anisongDb.map((song, index) => {
      return {
        uuid: uuidv4(),
        orderId: index,
        nominatedId: null,
        artist: song.songArtist,
        title: song.songName,
        anime: song.animeJPName,
        type: song.songType,
        startSample: 0,
        sampleLength: song.songLength,
        urlVideo: song.HQ || song.MQ,
        urlAudio: song.audio || song.HQ || song.MQ,
      };
    });
  }

  private parseSongList(songList: Song[]): Song[] {
    return songList.map((song, index) => {
      song.uuid = uuidv4();
      song.orderId = index;
      return song;
    });
  }
  
  public async createPR(prData: PR, creatorId: string): Promise<void> {
    // if (prData.songList.length === 0) {
    //   throw new HttpException(400, `No songs in PR`);
    // }

    console.log("OK");

    if (prData.anisongDb.length > 0) {
      console.log("ani");
      prData.songList = this.parseAnisongDb(prData.anisongDb);
      prData.anisongDb = [];
    } else {
      console.log("std");
      prData.songList = this.parseSongList(prData.songList);
    }

    console.log("parsed");

    prData.deadlineNomination = prData.deadlineNomination || 0;
    prData.finished = false;
    prData.creator = creatorId;
    prData.hashKey = hashKey(prData);
    console.log("haskeyed");
    writeFile(`./${prData.hashKey}.json`, JSON.stringify(prData), (err) => {
      if (err) {
        console.log(err);
      }
    });
    try {
      await PRModel.create(prData);
    } catch (err) {
      console.log(err);
    }
    console.log("created");
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
      deadlineNomination: pr.deadlineNomination,
      deadline: pr.deadline,
      numberVoters: sheets.length,
      numberSongs: pr.songList.length,
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
          totalRank: sheets.reduce((acc, sheet) => {
            const sheetSong = sheet.sheet.find(sheetSong => sheetSong.uuid === song.uuid);
            return acc + sheetSong.rank;
          }, 0),
          voters: sheets.map(sheet => {
            const voter = users.find(user => user.discordId === sheet.voterId);
            const sheetSong = sheet.sheet.find(sheetSong => sheetSong.uuid === song.uuid);
            return {
              name: voter.name,
              rank: sheetSong.rank,
            };
          }),
        };
      }).sort((a, b) => a.orderId - b.orderId),
      voters: sheets.map(sheet => {
        const voter = users.find(user => user.discordId === sheet.voterId);
        return {
          discordId: voter.discordId,
          username: voter.username,
          name: voter.name,
          image: voter.image,
        };
      }),
    };

    return prOutput;
  }

  public async getPRs(): Promise<PR[]> {
    const prs: PR[] = await PRModel.find();
    return prs;
  }
}
