import { SongOutput, TieSong } from './song.interface';

import { Nomination } from './nomination.interface';
import { PRStatus } from '@/enums/prStatus.enum';
import { UserOutput } from './user.interface';

export interface PR {
  _id?: string;
  name: string;
  creator: string;
  status: PRStatus;
  nomination: Nomination;
  deadline: string;
  finished: boolean;
  hashKey: string;
  numberSongs: number;
  mustBe: number;
  threadId: string;
  serverId: string;
  video?: string;
  affinityImage?: string;
  prStats?: string;
  songList: any[];
}

export interface PRInput extends PR {
  isNomination?: boolean;
  hidden?: boolean;
  blind?: boolean;
  hideNominatedSongList?: boolean;
  deadlineNomination?: string;
  songPerUser?: number;
}

export interface Tie {
  prId: string;
  name: string;
  status: boolean;
  tieSongs: TieSong[][];
}

export interface Tiebreak {
  tieSongs: {
    uuid: string;
    tiebreak: number;
  }[][];
}

export interface PROutput {
  _id: string;
  name: string;
  creator: string;
  status: PRStatus;
  nomination: Nomination;
  deadline: string;
  finished: boolean;
  numberVoters: number;
  numberSongs: number;
  mustBe: number;
  threadId: string;
  serverId: string;
  video?: string;
  affinityImage?: string;
  prStats?: string;
  tie: Tie;
  songList: SongOutput[];
  voters: UserOutput[];
}

export interface PRFinished {
  _id: string;
  name: string;
  video?: string;
  affinityImage?: string;
  prStats?: string;
  hasSheet: boolean;
  resultTable: SongOutput[];
}

export interface AnnouncePR {
  message: string;
}

export interface BulkAnnouncePR {
  message: string;
  prIds: string[];
}

export interface GSheetOutputPR {
  prId: string;
  gsheets: {
    userId: string,
    id: string,
    create?: boolean
    error?: string
  }[]
}
