export interface Vote {
  _id?: string;
  songId: string;
  userId: string;
  score: number;
  timestamp: Date;
}

export interface AverageVote {
  artist: string;
  title: string;
  average: number;
  nbVotes: number;
  url: string;
}

export interface UVote {
  artist: string;
  title: string;
  score: number;
}

export interface UserVote {
  username: string;
  countVote: number;
  avgVote: number;
  votes: UVote[];
}
