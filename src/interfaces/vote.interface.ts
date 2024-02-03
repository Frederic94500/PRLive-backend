export interface Vote {
  _id?: string;
  songId: string;
  userId: string;
  score: number;
  timestamp: Date;
}
