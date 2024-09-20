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
        sampleLength: 30,
        urlVideo: "https://ladist1.catbox.video/" + song.HQ || "https://ladist1.catbox.video/" + song.MQ,
        urlAudio: "https://ladist1.catbox.video/" + song.audio || "https://ladist1.catbox.video/" + song.HQ || "https://ladist1.catbox.video/" + song.MQ,
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
    console.log('creating');

    try {
      if (prData.songList.length !== 0) {
        if ('animeJPName' in prData.songList[0]) {
          console.log('ani');
          prData.songList = this.parseAnisongDb(prData.songList);
        } else {
          console.log('std');
          prData.songList = this.parseSongList(prData.songList);
        }
      } else {
        prData.songList = [];
      }
    } catch (err) {
      throw new HttpException(400, `Error parsing song list: ${err}`);
    }
    
    console.log('parsed');

    prData.deadlineNomination = prData.nomination ? prData.deadlineNomination : null;
    prData.finished = false;
    prData.creator = creatorId;
    prData.hashKey = hashKey(prData);
    prData.numberSongs = prData.songList.length;
    prData.mustBe = (prData.numberSongs * (prData.numberSongs + 1)) / 2;
    console.log('haskeyed');

    try {
      await PRModel.create(prData);
      console.log('created');
    } catch (err) {
      new HttpException(400, `Error creating PR: ${err}`);
    }
  }

  public async getPR(prId: string): Promise<PR> {
    const pr: PR = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    return pr;
  }

  public async addSongPR(prId: string, songData: Song): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    const sheets = await SheetModel.find({ prId });

    songData.uuid = uuidv4();
    songData.orderId = pr.songList.length;
    sheets.forEach(sheet => {
      sheet.sheet.push({ uuid: songData.uuid, orderId: pr.songList.length, rank: null, score: null });
      sheet.save();
    });
    
    pr.songList.push(songData);
    pr.hashKey = hashKey(pr);
    pr.numberSongs = pr.songList.length;
    pr.mustBe = (pr.numberSongs * (pr.numberSongs + 1)) / 2;
    await pr.save();
  }

  private verifySongList(prData: PR, prDB: PR): void {
    if (prData.songList.length !== prDB.songList.length) {
      throw new HttpException(400, `Song list length doesn't match`);
    }

    if (prData.songList.some(songData => !prDB.songList.some(songDB => songData.uuid === songDB.uuid))) {
      throw new HttpException(400, `Song list doesn't match (uuid)`);
    }

    prData.songList.forEach((songData, index) => {
      const songDB = prDB.songList.find(song => song.uuid === songData.uuid);
      if (songData.orderId !== songDB.orderId) {
        throw new HttpException(400, `Song list doesn't match (orderId)`);
      }
    });
  }

  public async updatePR(prId: string, prData: PR): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    this.verifySongList(prData, pr);

    pr.name = prData.name;
    pr.nomination = prData.nomination;
    pr.blind = prData.blind;
    pr.deadlineNomination = prData.deadlineNomination;
    pr.deadline = prData.deadline;
    pr.finished = prData.finished;
    pr.songList = prData.songList;
    await pr.save();
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
      mustBe: pr.mustBe,
      songList: pr.songList
        .map(song => {
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
            rankPosition: null,
            voters: sheets.map(sheet => {
              const voter = users.find(user => user.discordId === sheet.voterId);
              const sheetSong = sheet.sheet.find(sheetSong => sheetSong.uuid === song.uuid);
            
              const isFinished = sheet.sheet.reduce((acc, sheetSong) => acc + sheetSong.rank, 0) === pr.mustBe;
              const ranks = sheet.sheet.map(sheetSong => sheetSong.rank);
              const uniqueRanks = new Set(ranks);
            
              if (isFinished && ranks.length === uniqueRanks.size) {
                return {
                  name: voter.name,
                  discordId: voter.discordId,
                  rank: sheetSong.rank,
                };
              }
            
              return null;
            }).filter(voter => voter !== null),
          };
        })
        .sort((a, b) => a.orderId - b.orderId),
      voters: sheets.map(sheet => {
        const voter = users.find(user => user.discordId === sheet.voterId);

        const isFinished = sheet.sheet.reduce((acc, sheetSong) => acc + sheetSong.rank, 0) === pr.mustBe;
        const ranks = sheet.sheet.map(sheetSong => sheetSong.rank);
        const uniqueRanks = new Set(ranks);
        return {
          discordId: voter.discordId,
          username: voter.username,
          name: voter.name,
          image: voter.image,
          hasFinished: isFinished && ranks.length === uniqueRanks.size,
          staller: !isFinished,
          doubleRank: ranks.length !== uniqueRanks.size,
        };
      }),
    };

    prOutput.songList.sort((a, b) => b.totalRank - a.totalRank);

    prOutput.songList.forEach((song, index) => {
      song.rankPosition = prOutput.songList.length - index;
    });

    return prOutput;
  }

  public async deletePR(prId: string): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    SheetModel.deleteMany({ prId });

    await pr.deleteOne();
  }

  public async getPRs(): Promise<PR[]> {
    const prs: PR[] = await PRModel.find();
    return prs;
  }

  public async getSimple(): Promise<PR[]> {
    const users: User[] = await UserModel.find();
    const prs: PR[] = await PRModel.find(
      {},
      { _id: 1, name: 1, creator: 1, nomination: 1, blind: 1, deadlineNomination: 1, deadline: 1, finished: 1, numberSongs: 1 },
    );

    prs.forEach(pr => {
      const creator = users.find(user => user.discordId === pr.creator);
      pr.creator = creator ? creator.name : pr.creator;
    });

    return prs;
  }
}
