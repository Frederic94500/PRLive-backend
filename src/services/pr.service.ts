import { AnisongDb, Song, SongOutput } from '@/interfaces/song.interface';
import { ChannelType, TextChannel, ThreadAutoArchiveDuration } from 'discord.js';
import { DISCORD_BOT_LOGGING_CHANNEL_ID, DISCORD_BOT_SERVER_HOSTED_ID, DISCORD_BOT_SERVER_HOSTED_THREADS_ID } from '@/config';
import { PR, PRFinished, PRInput, PROutput, Tie, Tiebreak } from '@/interfaces/pr.interface';
import { hashKey, sendToS3 } from '@/utils/toolbox';

import { FileType } from '@/enums/fileType.enum';
import { HttpException } from '@/exceptions/httpException';
import { PRModel } from '@/models/pr.model';
import { PRStatus } from '@/enums/prStatus.enum';
import { Service } from 'typedi';
import { Sheet } from '@/interfaces/sheet.interface';
import { SheetModel } from '@/models/sheet.model';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import discordBot from '@services/discord.service';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class PRService {
  private parseAnisongDb(anisongDb: AnisongDb[]): Song[] {
    return anisongDb.map((song, index) => {
      return {
        uuid: uuidv4(),
        orderId: index,
        nominator: null,
        artist: song.songArtist,
        title: song.songName,
        source: song.animeJPName,
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
      const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
      discordChannelLog.send(
        `Error during creating PR for: ${prData.name}\nError: ${err}`,
      );
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
    prData.status = prData.isNomination ? PRStatus.NOMINATION : PRStatus.RANKING;

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
      if (pr.nomination) {
        pr.nomination.prId = pr._id;
      }
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

    pr.creator = (await UserModel.findOne({ discordId: pr.creator })).name;

    if (pr.nomination) {
      pr.nomination.nominatedSongList = pr.nomination.nominatedSongList.map(nominated => {
        const { uuid, nominator, at } = nominated;
        return { uuid, nominator: pr.nomination.hidden ? undefined : nominator, at };
      });

      pr.songList = pr.songList.map(song => {
        const { uuid, orderId, nominator, artist, title, source, type, urlVideo, urlAudio } = song;
        return {
          uuid,
          orderId,
          nominator: pr.nomination.hidden ? "" : nominator,
          artist: pr.nomination.blind ? "" : artist,
          title: pr.nomination.blind ? "" : title,
          source: pr.nomination.blind ? "" : source,
          type: pr.nomination.blind ? "" : type,
          urlVideo: pr.nomination.blind ? "" : urlVideo,
          urlAudio,
        };
      })
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
      sheet.latestUpdate = new Date().toISOString();
      sheet.save();
    });

    if (pr.nomination) {
      pr.nomination.nominatedSongList.push({ uuid: songData.uuid, nominator: songData.nominator, at: new Date().toISOString() });
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

    if (prDB.hashKey !== hashKey(prData)) {
      throw new HttpException(400, `PR data doesn't match (hashKey)`);
    }
  }

  public async uploadFilePR(prId: string, type: string, file: Express.Multer.File): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    file.filename = `${uuidv4()}.${file.mimetype.split('/')[1]}`;
    const key = `PR/${pr._id}/${file.filename}`;

    if (type === FileType.VIDEO) {
      pr.video = await sendToS3(key, file.mimetype, file.buffer);
    } else if (type === FileType.AFFINITY_IMAGE) {
      pr.affinityImage = await sendToS3(key, file.mimetype, file.buffer);
    } else {
      throw new HttpException(400, `Invalid type`);
    }

    await pr.save();
  }

  public async getUpdatePR(prId: string): Promise<PR> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    pr.creator = (await UserModel.findOne({ discordId: pr.creator })).name;

    return pr;
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
    if (prData.finished) {
      pr.status = PRStatus.FINISHED;
    } else if (prData.nomination && !prData.nomination.endNomination) {
      pr.status = PRStatus.NOMINATION;
    } else {
      pr.status = PRStatus.RANKING;
    }

    try {
      await pr.save();
    } catch (err) {
      throw new HttpException(400, `Error updating PR: ${err}`);
    }
  }

  private checkTie(pr: PROutput): Tie {
    const tie: Tie = {
      prId: pr._id,
      name: pr.name,
      status: false,
      tieSongs: [],
    };

    const totalRanks = pr.songList.map(song => song.totalRank);
    const duplicateRanks = totalRanks.filter((rank, index) => totalRanks.indexOf(rank) !== index);
    const tieSongs = pr.songList.filter(song => duplicateRanks.includes(song.totalRank));

    const groupedTieSongs = tieSongs.reduce((acc, song) => {
      const rankIndex = acc.findIndex(group => group[0]?.totalRank === song.totalRank);
      if (rankIndex === -1) {
        acc.push([song]);
      } else {
        acc[rankIndex].push(song);
      }
      return acc;
    }, [] as SongOutput[][]);

    for (let index = groupedTieSongs.length - 1; index >= 0; index--) {
      const group = groupedTieSongs[index];
      const groupTiebreak = group.map(song => song.tiebreak);
      const uniqueTiebreak = new Set(groupTiebreak);
    
      if (group.length === uniqueTiebreak.size) {
        groupedTieSongs.splice(index, 1);
      }
    }
    
    if (groupedTieSongs.length > 0) {
      tie.status = true;

      tie.tieSongs = groupedTieSongs.map(group => {
        return group.map(song => {
          return {
            uuid: song.uuid,
            urlAudio: song.urlAudio,
            totalRank: song.totalRank,
          };
        })
      });
    }

    return tie;
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
      creator: users.find(user => user.discordId === pr.creator).name,
      status: pr.status,
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
            nominator: song.nominator ? users.find(voter => voter.discordId === song.nominator).name : null,
            artist: song.artist,
            title: song.title,
            source: song.source,
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
            nominator: song.nominator,
            artist: song.artist,
            title: song.title,
            source: song.source,
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

  public async tiebreak(prId: string, tiebreak: Tiebreak, discordId: string): Promise<void> {
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

    tiebreak.tieSongs.forEach(tieSong => {
      tieSong.forEach(song => {
        if (!pr.songList.some(prSong => prSong.uuid === song.uuid)) {
          throw new HttpException(400, `Song not found`);
        }

        const prSong = pr.songList.find(prSong => prSong.uuid === song.uuid);
        prSong.tiebreak = song.tiebreak;
      });
    });

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
      discordChannelThread.delete();

      const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
      discordChannelLog.send(
        `PR deleted: ${pr.name}`,
      );
    } catch (err) {
      const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
      discordChannelLog.send(
        `Error during delete PR for: ${pr.name}\nError: ${err}`,
      );
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
      { _id: 1, name: 1, creator: 1, status: 1, nomination: { deadlineNomination: 1, hidden: 1, blind: 1, hideNominatedSongList: 1 }, deadline: 1, finished: 1, numberSongs: 1 },
    );

    prs.forEach(pr => {
      const creator = users.find(user => user.discordId === pr.creator);
      pr.creator = creator ? creator.name : pr.creator;
    });

    return prs;
  }
}
