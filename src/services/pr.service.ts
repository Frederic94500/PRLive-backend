import { AWS_S3_BUCKET_NAME, AWS_S3_STATIC_PAGE_URL, DISCORD_BOT_LOGGING_CHANNEL_ID, DISCORD_BOT_SERVER_HOSTED_ID, DISCORD_BOT_SERVER_HOSTED_THREADS_ID } from '@/config';
import { AnisongDb, Song, TiebreakWinner } from '@/interfaces/song.interface';
import { ChannelType, TextChannel, ThreadAutoArchiveDuration } from 'discord.js';
import { PR, PRFinished, PRInput, PROutput, Tie } from '@/interfaces/pr.interface';

import { FileType } from '@/enums/fileType.enum';
import { HttpException } from '@/exceptions/httpException';
import { PRModel } from '@/models/pr.model';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Service } from 'typedi';
import { Sheet } from '@/interfaces/sheet.interface';
import { SheetModel } from '@/models/sheet.model';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import discordBot from '@services/discord.service';
import { hashKey } from '@/utils/toolbox';
import s3Client from './aws.service';
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
        urlVideo: song.HQ ? song.HQ : song.MQ,
        urlAudio: song.audio ? song.audio : song.HQ ? song.HQ : song.MQ,
        tiebreak: 0,
      };
    });
  }

  private parseSongList(songList: Song[]): Song[] {
    return songList.map((song, index) => {
      song.uuid = uuidv4();
      song.orderId = index;
      song.tiebreak = 0;
      return song;
    });
  }

  private async createDiscordThread(prData: PRInput, creatorId: string): Promise<string> {
    try {
      const discordServerName = discordBot.guilds.cache.get(DISCORD_BOT_SERVER_HOSTED_ID).name;
      const discordChannelThreads = discordBot.channels.cache.get(DISCORD_BOT_SERVER_HOSTED_THREADS_ID) as TextChannel;

      if (discordChannelThreads) {
        const thread = await discordChannelThreads.threads.create({
          name: prData.name,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
          type: ChannelType.PrivateThread,
          reason: `${prData.name} for <@${creatorId}>`,
        });
        thread.send(`# ${prData.name}\nPR created by <@${creatorId}>\n\nDeadline: <t:${new Date(prData.deadline).getTime() / 1000}:F>`);

        const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
        discordChannelLog.send(
          `New PR created by <@${creatorId}> in ${discordServerName}: ${prData.name}\n\nDeadline: <t:${new Date(prData.deadline).getTime() / 1000}:F>`,
        );

        return thread.id;
      }
    } catch (err) {
      console.log(`Error Discord: ${err}`);
    }
  }

  public async createPR(prData: PRInput, creatorId: string): Promise<void> {
    console.log('creating');

    try {
      if (prData.songList) {
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

    prData.finished = false;
    prData.creator = creatorId;
    prData.numberSongs = prData.songList.length;
    prData.mustBe = (prData.numberSongs * (prData.numberSongs + 1)) / 2;
    prData.video = null;
    prData.affinityImage = null;
    prData.prStats = null;

    prData.hashKey = hashKey(prData);
    console.log('haskeyed');

    prData.nomination = prData.isNomination ? {
      prId: "",
      hidden: prData.hidden,
      blind: prData.blind,
      hideNominatedSongList: prData.hideNominatedSongList,
      deadlineNomination: prData.deadlineNomination,
      endNomination: false,
      songPerUser: prData.songPerUser,
      nominatedSongList: [],
    } : null;

    try {
      const pr = await PRModel.create(prData);
      pr.nomination.prId = pr._id;
      pr.threadId = await this.createDiscordThread(prData, creatorId);
      await pr.save();
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

    songData.uuid = uuidv4();
    songData.orderId = pr.songList.length;
    songData.tiebreak = 0;

    const sheets = await SheetModel.find({ prId });
    sheets.forEach(sheet => {
      sheet.sheet.push({ uuid: songData.uuid, orderId: pr.songList.length, rank: null, score: null, comment: "" });
      sheet.save();
    });

    if (pr.nomination) {
      pr.nomination.nominatedSongList.push({ uuid: songData.uuid, nominatedId: songData.nominatedId, at: new Date().toISOString() });
    }

    pr.songList.push(songData);
    pr.hashKey = hashKey(pr);
    pr.numberSongs = pr.songList.length;
    pr.mustBe = (pr.numberSongs * (pr.numberSongs + 1)) / 2;
    await pr.save();
  }

  public async deleteSongPR(prId: string, songUuid: string): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    const sheets = await SheetModel.find({ prId });
    sheets.forEach(sheet => {
      const index = sheet.sheet.findIndex(song => song.uuid === songUuid);
      sheet.sheet.splice(index, 1);
      sheet.sheet.forEach((song, index) => (song.orderId = index));
      sheet.save();
    });

    if (pr.nomination) {
      const index = pr.nomination.nominatedSongList.findIndex(nominated => nominated.uuid === songUuid);
      if (index !== -1) {
        pr.nomination.nominatedSongList.splice(index, 1);
      }
    }

    const index = pr.songList.findIndex(song => song.uuid === songUuid);
    pr.songList.splice(index, 1);
    pr.songList.forEach((song, index) => (song.orderId = index));
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

  public async uploadFilePR(prId: string, type: string, file: Express.Multer.File): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    file.filename = `${uuidv4()}.${file.mimetype.split('/')[1]}`;
    const link = `PR/${pr._id}/${file.filename}`;
    const url = `${AWS_S3_STATIC_PAGE_URL}/${link}`;

    if (type === FileType.VIDEO) {
      pr.video = url;
    } else if (type === FileType.AFFINITY_IMAGE) {
      pr.affinityImage = url;
    } else {
      throw new HttpException(400, `Invalid type`);
    }

    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: link,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      await pr.save();
    } catch (error) {
      throw new HttpException(500, 'File upload failed');
    }
  }

  public async updatePR(prId: string, prData: PR): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    this.verifySongList(prData, pr);

    pr.name = prData.name;
    pr.nomination = prData.nomination;
    pr.deadline = prData.deadline;
    pr.finished = prData.finished;
    pr.songList = prData.songList;
    pr.video = prData.video;
    pr.affinityImage = prData.affinityImage;
    pr.prStats = prData.prStats;
    await pr.save();
  }

  private checkTie(pr: PROutput): Tie {
    const tiebreak: Tie = {
      prId: pr._id,
      status: false,
      tieSong: [],
    };

    const totalRanks = pr.songList.map(song => song.totalRank);
    const duplicateRanks = totalRanks.filter((rank, index) => totalRanks.indexOf(rank) !== index);
    const tieSongs = pr.songList.filter(song => duplicateRanks.includes(song.totalRank));

    if (tieSongs.length > 0) {
      tiebreak.status = true;

      const resolvedTiebreaks = tieSongs.filter(song => song.tiebreak !== 0);
      const unresolvedTiebreaks = tieSongs.filter(song => song.tiebreak === 0);

      if (resolvedTiebreaks.length > 0) {
        resolvedTiebreaks.sort((a, b) => b.tiebreak - a.tiebreak);
        tiebreak.tieSong.push(
          ...resolvedTiebreaks.map(song => ({
            uuid: song.uuid,
            urlAudio: song.urlAudio,
            totalRank: song.totalRank,
          })),
        );
      }

      if (unresolvedTiebreaks.length > 0) {
        tiebreak.tieSong.push(
          ...unresolvedTiebreaks.map(song => ({
            uuid: song.uuid,
            urlAudio: song.urlAudio,
            totalRank: song.totalRank,
          })),
        );
      }

      if (unresolvedTiebreaks.length === 0 && resolvedTiebreaks.length > 0) {
        tiebreak.status = false;
      }
    }

    return tiebreak;
  }

  public async output(prId: string): Promise<PROutput> {
    const pr: PR = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    const sheets: Sheet[] = await SheetModel.find({ prId });

    const users: User[] = await UserModel.find();
    if (users.length === 0) {
      throw new HttpException(404, `No users found`);
    }

    const prOutput: PROutput = {
      _id: pr._id,
      name: pr.name,
      creator: pr.creator,
      nomination: pr.nomination,
      deadline: pr.deadline,
      finished: pr.finished,
      numberVoters: sheets.length || 0,
      numberSongs: pr.songList.length,
      mustBe: pr.mustBe,
      threadId: pr.threadId,
      video: pr.video,
      affinityImage: pr.affinityImage,
      prStats: pr.prStats,
      tie: null,
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
            tiebreak: song.tiebreak,
            totalRank: sheets.reduce((acc, sheet) => {
              const sheetSong = sheet.sheet.find(sheetSong => sheetSong.uuid === song.uuid);
              return acc + sheetSong.rank;
            }, 0),
            rankPosition: null,
            voters: sheets
              .map(sheet => {
                const sheetSong = sheet.sheet.find(sheetSong => sheetSong.uuid === song.uuid);

                const isFinished = sheet.sheet.reduce((acc, sheetSong) => acc + sheetSong.rank, 0) === pr.mustBe;
                const ranks = sheet.sheet.map(sheetSong => sheetSong.rank);
                const uniqueRanks = new Set(ranks);

                if (isFinished && ranks.length === uniqueRanks.size) {
                  return {
                    name: sheet.name,
                    discordId: sheet.voterId,
                    rank: sheetSong.rank,
                  };
                }

                return null;
              })
              .filter(voter => voter !== null),
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
          name: sheet.name,
          image: sheet.image,
          hasFinished: isFinished && ranks.length === uniqueRanks.size,
          staller: !isFinished,
          doubleRank: ranks.length !== uniqueRanks.size,
        };
      }),
    };

    prOutput.songList.sort((a, b) => {
      if (a.totalRank === b.totalRank) {
        return a.tiebreak - b.tiebreak;
      }
      return b.totalRank - a.totalRank;
    });

    prOutput.songList.forEach((song, index) => {
      song.rankPosition = prOutput.songList.length - index;
    });

    prOutput.tie = this.checkTie(prOutput);

    return prOutput;
  }

  public async finished(prId: string, discordId: string): Promise<PRFinished> {
    const pr: PROutput = await this.output(prId);

    let sheet = null;
    if (discordId) {
      sheet = await SheetModel.findOne({ prId, voterId: discordId });
    }
    
    const prFinished: PRFinished = {
      _id: pr._id,
      name: pr.name,
      video: pr.video,
      affinityImage: pr.affinityImage,
      prStats: pr.prStats,
      hasSheet: sheet ? true : false,
      resultTable: pr.songList
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
            totalRank: song.totalRank,
            rankPosition: song.rankPosition,
            tiebreak: song.tiebreak,
            voters: song.voters,
          };
        })
        .sort((a, b) => b.rankPosition - a.rankPosition),
    };

    return prFinished;
  }

  public async getTie(prId: string): Promise<Tie> {
    const pr: PROutput = await this.output(prId);

    return pr.tie;
  }

  public async tiebreak(prId: string, data: TiebreakWinner, discordId: string): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    const tie = await this.getTie(prId);
    if (!tie.status) {
      throw new HttpException(400, `No tie to break`);
    }

    const sheet = await SheetModel.findOne({ prId, voterId: discordId });
    if (sheet) {
      throw new HttpException(400, `You already voted, you can't break the tie`);
    }

    const songWinner = pr.songList.find(song => song.uuid === data.uuid);
    const songsLosers = pr.songList.filter(song => song.totalRank === songWinner.totalRank && song.uuid !== songWinner.uuid);

    songWinner.tiebreak += 1;
    songsLosers.forEach(song => (song.tiebreak -= 1));

    await pr.save();
  }

  public async deletePR(prId: string): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    await SheetModel.deleteMany({ prId: prId });

    await pr.deleteOne();

    try {
      const discordChannelThread = discordBot.channels.cache.get(pr.threadId) as TextChannel;
      if (!discordChannelThread) {
        return;
      }
      discordChannelThread.delete();
    } catch (err) {
      console.log(`Error Discord: ${err}`);
    }
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
