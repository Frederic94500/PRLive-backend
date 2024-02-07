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
  numberOfVotes: number;
  url: string;
}
