export interface Vote {
  _id?: string;
  songId: string;
  userId: string;
  vote: number;
  timestamp: Date;
}
