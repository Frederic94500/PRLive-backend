import { HttpException } from '@/exceptions/httpException';
import { PR } from '@/interfaces/pr.interface';
import { PRModel } from '@/models/pr.model';
import { Service } from 'typedi';
import { Sheet } from '@/interfaces/sheet.interface';
import { SheetModel } from '@/models/sheet.model';
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
      sheet: pr.songList.map(song => {
        return {
          uuid: song.uuid,
          orderId: song.orderId,
          rank: null,
          score: null,
        };
      }),
    };
    return await SheetModel.create(sheet);
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
    
    await SheetModel.findByIdAndUpdate(sheetData._id, sheetData);
  }
}
