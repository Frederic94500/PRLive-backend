import { SongSorter } from "./song.interface";

export interface SheetSimple {
    prId: string;
    status: string;
}

export interface Sheet {
    _id?: string;
    prId: string;
    voterId: string;
    latestUpdate: string;
    name: string;
    image: string;
    gsheet?: string;
    sheet: SheetSong[];
}

export interface SheetSong {
    uuid: string;
    orderId: number;
    rank: number;
    score: number;
    comment?: string;
}

export interface SorterSheet {
  sheetId: string;
  prId: string;
  voterId: string;
  latestUpdate: string;
  name: string;
  image?: string;
  songList: SongSorter[];
}
