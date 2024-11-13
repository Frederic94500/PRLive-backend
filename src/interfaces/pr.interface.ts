import { SongOutput, TiebreakSong as TieSong } from './song.interface';

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
  status: boolean;
  tieSong: TieSong[];
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
