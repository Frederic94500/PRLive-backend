import { AnisongDb, Song, SongOutput } from "./song.interface";

import { UserOutput } from "./user.interface";

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
    songList: Song[];
    anisongDb: AnisongDb[];
}

export interface PROutput {
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
