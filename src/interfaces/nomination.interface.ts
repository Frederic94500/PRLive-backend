export interface NominatedSongs {
  uuid: string;
  nominatedId: string;
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
  hidden: boolean;
  blind: boolean;
  hideNominatedSongList: boolean;
  deadlineNomination: string;
  endNomination: boolean;
  songPerUser: number;
  remainingNominations: number;
  songList: any[];
}
