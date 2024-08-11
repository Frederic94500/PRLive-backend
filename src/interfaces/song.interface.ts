import { Vote } from "./vote.interface";

export interface Song {
  uuid: string;
  orderId: number;
  nominatedId?: string;
  artist: string;
  title: string;
  anime?: string;
  type: string;
  startSample: number;
  sampleLength: number;
  urlVideo: string;
  urlAudio: string;
}

export interface SongOutput {
  uuid: string;
  orderId: number;
  nominatedId?: string;
  artist: string;
  title: string;
  anime?: string;
  type: string;
  startSample: number;
  sampleLength: number;
  urlVideo: string;
  urlAudio: string;
  voters: Vote[];
}
