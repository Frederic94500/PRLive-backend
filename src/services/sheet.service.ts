import { Sheet, SheetSimple } from '@/interfaces/sheet.interface';
import discordBot, { addDiscordUserInThread, removeDiscordUserInThread } from '@services/discord.service';

import { HttpException } from '@/exceptions/httpException';
import { PR } from '@/interfaces/pr.interface';
import { PRModel } from '@/models/pr.model';
import { ServerModel } from '@/models/server.model';
import { Service } from 'typedi';
import { SheetModel } from '@/models/sheet.model';
import { SheetStatus } from '@/enums/sheetStatus.enum';
import { User } from '@/interfaces/user.interface';
import { UserModel } from '@/models/user.model';
import { hashKey } from '@/utils/toolbox';
import { createSpreadsheet, importSpreadsheetToSheet } from './google.service';

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

    const server = (await ServerModel.findById(pr.serverId));
    if (!server) {
      throw new HttpException(404, 'Server Discord not found');
    }

    try {
      const guild = discordBot.guilds.cache.get(server.discordId);
      if (!guild) {
        throw new HttpException(404, 'Server not found');
      }

      const userInDiscord = await guild.members.fetch(userId);
      if (!userInDiscord) {
        throw new HttpException(403, 'User is not in the server');
      }
    } catch (error) {
      console.error(`Error fetching user ${userId} in guild ${server.name} (ID: ${server.discordId}):`, error);
      throw new HttpException(403, 'User is not in the server');
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

    addDiscordUserInThread(pr.name, pr.deadline, pr.threadId, userId);

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

  public async getSheetNoAuth(prId: string, voterId: string, sheetId: string): Promise<Sheet> {
    const sheet = await SheetModel.findById(sheetId);
    if (!sheet) {
      throw new HttpException(404, 'Sheet not found');
    }
    if (sheet.prId !== prId || sheet.voterId !== voterId) {
      throw new HttpException(400, 'Invalid sheet data');
    }

    return sheet;
  }

  public async editSheetNoAuth(sheetData: Sheet, prId: string, voterId: string, sheetId: string): Promise<void> {
    if (sheetData.prId !== prId || sheetData.voterId !== voterId || sheetData._id !== sheetId) {
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

    await SheetModel.findByIdAndUpdate(sheetId, sheetData);
  }

  public async getSheetUser(prId: string, voterId: string): Promise<Sheet> {
    const sheet = await SheetModel.findOne({ prId, voterId });
    if (!sheet) {
      throw new HttpException(404, 'Sheet not found');
    }

    return sheet;
  }

  public async getGSheetUser(prId: string, userId: string): Promise<{status: number, url: string}> {
    console.log('Getting gsheet for', prId, userId);
    const sheet = await SheetModel.findOne({ prId, voterId: userId });
    if (!sheet) {
      throw new HttpException(404, 'Sheet not found');
    }

    if (!sheet.gsheet) {
      const pr = await PRModel.findById(prId);
      if (!pr) {
        throw new HttpException(404, 'PR not found');
      }

      const user = await UserModel.findOne({ discordId: userId });
      if (!user) {
        throw new HttpException(404, 'Voter not found');
      }

      sheet.gsheet = await createSpreadsheet(pr, user, sheet);

      await SheetModel.findByIdAndUpdate(sheet._id, sheet);

      return {status: 201, url: `https://docs.google.com/spreadsheets/d/${sheet.gsheet}`};
    }
    
    return {status: 200, url: `https://docs.google.com/spreadsheets/d/${sheet.gsheet}`};
  }

  public async importGSheetUser(prId: string, userId: string): Promise<Sheet> {
    const sheet = await SheetModel.findOne({ prId, voterId: userId });
    if (!sheet) {
      throw new HttpException(404, 'Sheet not found');
    }
    if (!sheet.gsheet) {
      throw new HttpException(400, 'No GSheet to import from');
    }

    const importedSheet = await importSpreadsheetToSheet(sheet.gsheet);
    
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, 'PR not found');
    }

    sheet.sheet = importedSheet;
    if (hashKey(sheet) !== pr.hashKey) {
      throw new HttpException(400, 'Invalid sheet data by hashkey after import');
    }
    sheet.latestUpdate = Date.now().toString();
    await SheetModel.findByIdAndUpdate(sheet._id, sheet);

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

    removeDiscordUserInThread(pr.name, pr.threadId, voterId);
  }

  public async deleteSheetNoAuth(prId: string, voterId: string, sheetId: string): Promise<void> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, 'PR not found');
    }
    if (pr.finished) {
      throw new HttpException(400, 'PR is finished, no more deleting');
    }

    const sheet = await SheetModel.findById(sheetId);
    if (!sheet) {
      throw new HttpException(404, 'Sheet not found');
    }
    if (sheet.prId !== prId || sheet.voterId !== voterId) {
      throw new HttpException(400, 'Invalid sheet data');
    }

    await SheetModel.findByIdAndDelete(sheetId);

    removeDiscordUserInThread(pr.name, pr.threadId, voterId);
  }
}
