import { Document, Schema, model } from 'mongoose';

import { Song } from '@/interfaces/song.interface';

const SongSchema: Schema = new Schema({
  artist: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
});

export const SongModel = model<Song & Document>('Song', SongSchema);
