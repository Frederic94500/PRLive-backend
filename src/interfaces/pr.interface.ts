import { Song, SongOutput } from "./song.interface";

export interface PR {
    _id?: string;
    name: string;
    creator: string;
    nomination: boolean;
    blind: boolean;
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
    deadline: number;
    songList: SongOutput[];
}