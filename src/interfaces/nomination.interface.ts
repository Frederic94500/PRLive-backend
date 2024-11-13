export interface NominatedSongs {
  uuid: string;
  nominator: string;
  at: string;
}

export interface Nomination {
  _id?: string;
  prId: string;
  hidden: boolean;
  blind: boolean;
  hideNominatedSongList: boolean;
  deadlineNomination: string;
  endNomination: boolean;
  songPerUser: number;
  nominatedSongList: NominatedSongs[];
}

export interface NominationData {
  _id: string;
  prId: string;
  name: string;
  hidden: boolean;
  blind: boolean;
  hideNominatedSongList: boolean;
  deadlineNomination: string;
  endNomination: boolean;
  songPerUser: number;
  remainingNominations: number;
  numberSongs: number;
  songList: any[];
  nominators: {nominator: string, name: string}[];
}
