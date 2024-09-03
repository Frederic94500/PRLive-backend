interface LinkedIds {
  myanimelist: number;
  anidb: number;
  anilist: number;
  kitsu: number;
}

interface Artist {
  id: number;
  names: string[];
  line_up_id: number | null;
  groups: any; 
  members: any; 
}

interface Composer {
  id: number;
  names: string[];
  line_up_id: number | null;
  groups: any; 
  members: any; 
}

interface Arranger {
  id: number;
  names: string[];
  line_up_id: number | null;
  groups: any; 
  members: any; 
}

export interface AnisongDb {
  annId: number;
  annSongId: number;
  animeENName: string;
  animeJPName: string;
  animeAltName: string | null;
  animeVintage: string;
  linked_ids: LinkedIds;
  animeType: string;
  songType: string;
  songName: string;
  songArtist: string;
  songDifficulty: number;
  songCategory: string;
  songLength: number;
  HQ: string;
  MQ: string | null;
  audio: string;
  artists: Artist[];
  composers: Composer[];
  arrangers: Arranger[];
}

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
  totalRank: number;
  voters: {
    name: string;
    discordId: string;
    rank: number;
  }[];
}
