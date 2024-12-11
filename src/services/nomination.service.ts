import { DISCORD_BOT_LOGGING_CHANNEL_ID } from '@/config';
import { HttpException } from '@/exceptions/httpException';
import { NominationData } from '@/interfaces/nomination.interface';
import { PRModel } from '@/models/pr.model';
import { PRService } from './pr.service';
import { PRStatus } from '@/enums/prStatus.enum';
import { Service } from 'typedi';
import { SheetModel } from '@/models/sheet.model';
import { Song } from '@/interfaces/song.interface';
import { TextChannel } from 'discord.js';
import { UserModel } from '@/models/user.model';
import discordBot from '@services/discord.service';
import { hashKey } from '@/utils/toolbox';

@Service()
export class NominationService {
  private prService = new PRService();

  public async getNomination(prId: string, userId: string): Promise<NominationData> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }

    const usersList = [...new Set(pr.nomination.nominatedSongList.map(nominated => nominated.nominator))];
    const users = await UserModel.find({ discordId: { $in: usersList } });

    const remainingNominations =
      pr.nomination.songPerUser - pr.nomination.nominatedSongList.filter(nominated => nominated.nominator === userId).length;
    let songList = pr.songList
      .map(song => {
        const { uuid, orderId, nominator, artist, title, source, type, urlVideo, urlAudio } = song;
        return {
          uuid,
          orderId,
          isAllowedEdit: nominator === userId,
          nominator: pr.nomination.hidden ? undefined : users.find(user => nominator === user.discordId).name,
          artist: pr.nomination.blind ? undefined : artist,
          title: pr.nomination.blind ? undefined : title,
          source: pr.nomination.blind ? undefined : source,
          type: pr.nomination.blind ? undefined : type,
          urlVideo: pr.nomination.blind ? undefined : urlVideo,
          urlAudio: pr.nomination.blind ? undefined : urlAudio,
        };
      }).filter(song => !pr.nomination.hideNominatedSongList || song.isAllowedEdit);

    if (pr.nomination.blind) {
      songList = songList.filter(song => song.isAllowedEdit);
    }

    return {
      _id: pr.nomination._id,
      prId: pr.nomination.prId,
      name: pr.name,
      hidden: pr.nomination.hidden,
      blind: pr.nomination.blind,
      hideNominatedSongList: pr.nomination.hideNominatedSongList,
      deadlineNomination: pr.nomination.deadlineNomination,
      endNomination: pr.nomination.endNomination,
      songPerUser: pr.nomination.songPerUser,
      numberSongs: pr.songList.length,
      remainingNominations,
      songList,
      nominators: pr.nomination.hidden
        ? null
        : users.map(user => {
            return {
              nominator: user.discordId,
              name: user.name,
            };
          }),
    };
  }

  public async nominate(prId: string, userId: string, songData: Song) {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    if (!pr.nomination) {
      throw new HttpException(404, `This PR is not a nomination`);
    }
    if (pr.nomination.endNomination) {
      throw new HttpException(400, `Nomination is closed`);
    }
    if (pr.nomination.songPerUser <= pr.nomination.nominatedSongList.filter(nominated => nominated.nominator === userId).length) {
      throw new HttpException(400, `You have already nominated the maximum number of songs`);
    }

    songData.nominator = userId;

    this.prService.addSongPR(prId, songData);
  }

  public async getNominationSong(prId: string, userId: string, uuid: string): Promise<Song> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    const song = pr.songList.find(song => song.uuid === uuid);
    if (!song) {
      throw new HttpException(404, `Song doesn't exist`);
    }
    if (song.nominator !== userId) {
      throw new HttpException(403, `You are not the nominator of this song`);
    }

    return song;
  }

  public async editNomination(prId: string, userId: string, uuid: string, songData: Song) {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    const song = pr.songList.find(song => song.uuid === uuid);
    if (!song) {
      throw new HttpException(404, `Song doesn't exist`);
    }
    if (song.nominator !== userId) {
      throw new HttpException(403, `You are not the nominator of this song`);
    }

    song.artist = songData.artist;
    song.title = songData.title;
    song.source = songData.source;
    song.type = songData.type;
    song.startSample = songData.startSample;
    song.urlVideo = songData.urlVideo;
    song.urlAudio = songData.urlAudio;

    await pr.save();
  }

  public async endNomination(prId: string) {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    if (!pr.nomination) {
      throw new HttpException(404, `This PR is not a nomination`);
    }
    if (pr.nomination.endNomination) {
      throw new HttpException(400, `Nomination is already closed`);
    }

    pr.nomination.endNomination = true;
    pr.status = PRStatus.RANKING;

    pr.songList = pr.songList
      .sort((a, b) => Math.random() - 0.5)
      .map((song, index) => {
        song.orderId = index + 1;
        return song;
      });
    pr.hashKey = hashKey(pr);

    await pr.save();

    const usersList = [...new Set(pr.nomination.nominatedSongList.map(nominated => nominated.nominator))];
    const users = await UserModel.find({ discordId: { $in: usersList } });

    users.forEach(async user => {
      const sheet = new SheetModel({
        prId,
        voterId: user.discordId,
        latestUpdate: new Date(),
        name: user.name,
        image: user.image,
        sheet: pr.songList.map(song => {
          return {
            uuid: song.uuid,
            orderId: song.orderId,
            rank: null,
            score: null,
            comment: '',
          };
        }),
      });
      await sheet.save();
      try {
        const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
        discordChannelLog.send(`Sheet created for <@${user.discordId}> in PR: ${pr.name}`);
      } catch (error) {
        const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
        discordChannelLog.send(`Error on Sheet creation for <@${user.discordId}> in PR: ${pr.name}`);
      }
    });

    try {
      const pingUsers = users.map(user => `<@${user.discordId}>`).join(' ');
      const discordChannelThread = discordBot.channels.cache.get(pr.threadId) as TextChannel;
      discordChannelThread.send(
        `${pingUsers}\nNomination is closed, your sheet is ready!\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`,
      );

      const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
      discordChannelLog.send(`Mass ping message for PR: ${pr.name}`);
    } catch (error) {
      const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
      discordChannelLog.send(`Error on mass ping message for PR: ${pr.name}`);
    }
  }
}
