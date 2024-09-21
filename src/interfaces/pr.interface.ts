import { SongOutput } from './song.interface';
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
  songList: SongOutput[];
  voters: UserOutput[];
}
