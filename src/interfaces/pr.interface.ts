import { SongOutput, TiebreakSong as TieSong } from './song.interface';

import { UserOutput } from './user.interface';

export interface PR {
  _id?: string;
  name: string;
  creator: string;
  nomination: boolean;
  blind: boolean;
  deadlineNomination?: string;
  deadline: string;
  finished: boolean;
  hashKey: string;
  numberSongs: number;
  mustBe: number;
  songList: any[];
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
  nomination: boolean;
  blind: boolean;
  deadlineNomination?: string;
  deadline: string;
  numberVoters: number;
  numberSongs: number;
  mustBe: number;
  tie: Tie;
  songList: SongOutput[];
  voters: UserOutput[];
}
