import { DISCORD_BOT_LOGGING_CHANNEL_ID, DISCORD_BOT_SERVER_HOSTED_ID } from '@config';
import { Sheet, SheetSimple } from '@/interfaces/sheet.interface';
import { TextChannel, ThreadChannel } from 'discord.js';

import { HttpException } from '@/exceptions/httpException';
import { PR } from '@/interfaces/pr.interface';
import { PRModel } from '@/models/pr.model';
import { Service } from 'typedi';
import { SheetModel } from '@/models/sheet.model';
import { SheetStatus } from '@/enums/sheetStatus.enum';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import discordBot from '@services/discord.service';
import { hashKey } from '@/utils/toolbox';

@Service()
export class SheetService {
  public async gets(userId: string): Promise<SheetSimple[]> {
    const pr: PR[] = await PRModel.find();
    const sheets: Sheet[] = await SheetModel.find({ voterId: userId });

    return pr.map(pr => {
      let ranks = null;
      let uniqueRanks = null;
      const sheetUser = sheets.find(sheet => sheet.prId === String(pr._id));
      if (sheetUser) {
        ranks = sheetUser.sheet.map(sheetSong => sheetSong.rank);
        uniqueRanks = new Set(ranks);
      }
      return {
        prId: pr._id,
        status: sheetUser
          ? sheetUser.sheet.reduce((acc, sheetSong) => acc + sheetSong.rank, 0) === pr.mustBe && uniqueRanks.size === ranks.length
            ? SheetStatus.FILLED
            : SheetStatus.UNFILLED
          : SheetStatus.NOTJOINED,
      };
    });
  }

  public async getId(prId: string, userId: string): Promise<Sheet> {
    let sheet: Sheet = await SheetModel.findOne({ prId: prId, voterId: userId });

    if (sheet) {
      return sheet;
    }

    try {
      const guild = discordBot.guilds.cache.get(DISCORD_BOT_SERVER_HOSTED_ID);
      if (!guild) {
        throw new HttpException(404, 'Server not found');
      }

      const userInDiscord = await guild.members.fetch(userId);
      if (!userInDiscord) {
        throw new HttpException(403, 'User is not in the server');
      }
    } catch (error) {
      console.error(`Error fetching user ${userId} in guild ${DISCORD_BOT_SERVER_HOSTED_ID}:`, error);
      throw new HttpException(403, 'User is not in the server');
    }

    const pr: PR = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, 'PR not found');
    }
    if (pr.finished) {
      throw new HttpException(400, 'PR is finished, no more joining');
    }
    if (pr.nomination) {
      if (!pr.nomination.endNomination) {
        throw new HttpException(400, 'Nomination is not closed yet');
      }
    }

    const user: User = await UserModel.findOne({ discordId: userId });
    sheet = {
      prId: prId,
      voterId: userId,
      latestUpdate: Date.now().toString(),
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
    };

    try {
      const discordChannelThread = discordBot.channels.cache.get(pr.threadId) as TextChannel;
      discordChannelThread.send(`Welcome <@${userId}>\n\nDeadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`);

      const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
      discordChannelLog.send(`Sheet created for <@${userId}> in PR: ${pr.name}`);
    } catch (error) {
      throw new HttpException(400, `Discord error: ${error}`);
    }

    try {
      return await SheetModel.create(sheet);
    } catch (error) {
      throw new HttpException(400, `Sheet creation failed: ${error}`);
    }
  }

  public async editId(sheetData: Sheet, prId: string, userId: string): Promise<void> {
    if (sheetData.prId !== prId || sheetData.voterId !== userId) {
      throw new HttpException(400, 'Invalid sheet data');
    }

    const hashkey = hashKey(sheetData);
    const pr = await PRModel.findById(prId);

    if (hashkey !== pr.hashKey) {
      throw new HttpException(400, 'Invalid sheet data by hashkey');
    }
    if (pr.finished) {
      throw new HttpException(400, 'PR is finished, no more editing');
    }

    sheetData.latestUpdate = Date.now().toString();

    await SheetModel.findByIdAndUpdate(sheetData._id, sheetData);
  }

  public async getSheetUser(prId: string, voterId: string): Promise<Sheet> {
    const sheet = await SheetModel.findOne({ prId, voterId });
    if (!sheet) {
      throw new HttpException(404, 'Sheet not found');
    }

    return sheet;
  }

  public async deleteSheetUser(prId: string, voterId: string, creator: boolean = false): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, 'PR not found');
    }
    if (pr.finished && !creator) {
      throw new HttpException(400, 'PR is finished, no more deleting');
    }

    const sheet = await SheetModel.findOne({ prId: prId, voterId: voterId });
    if (!sheet) {
      throw new HttpException(404, 'Sheet not found');
    }

    await SheetModel.findOneAndDelete({ prId: prId, voterId: voterId });

    try {
      const discordChannelLog = discordBot.channels.cache.get(DISCORD_BOT_LOGGING_CHANNEL_ID) as TextChannel;
      const discordChannelThread = discordBot.channels.cache.get(pr.threadId) as ThreadChannel;

      discordChannelLog.send(`Sheet deleted for <@${voterId}> in PR: ${pr.name}`);
      discordChannelThread.members.remove(voterId);
    } catch (error) {
      throw new HttpException(400, `Discord error: ${error}`);
    }
  }
}
