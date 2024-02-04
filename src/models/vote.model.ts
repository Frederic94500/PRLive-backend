import { Document, Schema, model } from 'mongoose';

import { Vote } from '@/interfaces/vote.interface';

const VoteSchema: Schema = new Schema({
  songId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

export const VoteModel = model<Vote & Document>('Vote', VoteSchema);
