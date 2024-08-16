import { Song, SongOutput } from "./song.interface";

import { UserOutput } from "./user.interface";

export interface PR {
    _id?: string;
    name: string;
    creator: string;
    nomination: boolean;
    blind: boolean;
    deadlineNomination: number;
    deadline: number;
    finished: boolean;
    hashKey: string;
    songList: Song[];
}

export interface PROutput {
    name: string;
    creator: string;
    nomination: boolean;
    blind: boolean;
    deadlineNomination: number;
    deadline: number;
    numberVoters: number;
    numberSongs: number;
    songList: SongOutput[];
    voters: UserOutput[];
}
