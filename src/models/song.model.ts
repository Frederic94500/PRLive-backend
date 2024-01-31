import { Song } from '@/interfaces/songs.interface';
import { model, Document, Schema } from 'mongoose';

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
    type: URL,
    required: true,
    unique: true,
  },
});

export const SongModel = model<Song & Document>('Song', SongSchema);
