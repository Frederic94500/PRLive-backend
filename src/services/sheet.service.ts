import { DISCORD_BOT_LOGGING_CHANNEL_ID } from '@/config';
import { HttpException } from '@/exceptions/httpException';
import { PR } from '@/interfaces/pr.interface';
import { PRModel } from '@/models/pr.model';
import { Service } from 'typedi';
import { Sheet } from '@/interfaces/sheet.interface';
import { SheetModel } from '@/models/sheet.model';
import { TextChannel } from 'discord.js';
import discordBot from '@services/discord.service';
import { hashKey } from '@/utils/toolbox';

@Service()
export class SheetService {
  public async getId(prId: string, userId: string): Promise<Sheet> {
    let sheet: Sheet = await SheetModel.findOne({ prId: prId, voterId: userId });

    if (sheet) {
      return sheet;
    }

    const pr: PR = await PRModel.findById(prId);
    sheet = {
      prId: prId,
      voterId: userId,
      latestUpdate: Date.now().toString(),
      sheet: pr.songList.map(song => {
        return {
          uuid: song.uuid,
          orderId: song.orderId,
          rank: null,
          score: null,
        };
      }),
    };

    try {
      const discordChannelThread = discordBot.channels.cache.get(pr.threadId) as TextChannel;
      discordChannelThread.send(`Welcome <@${userId}>\n\n Deadline: <t:${new Date(pr.deadline).getTime() / 1000}:F>`);

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
}
