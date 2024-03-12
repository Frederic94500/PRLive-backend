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
});

export const SongModel = model<Song & Document>('Song', SongSchema);
