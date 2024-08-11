import { Song, SongOutput } from "./song.interface";

export interface PR {
    _id?: string;
    name: string;
    creator: string;
    nomination: boolean;
    blind: boolean;
    deadline: number;
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