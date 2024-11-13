import { Document, Schema, model } from 'mongoose';

import { Song } from '@/interfaces/song.interface';

const SongSchema: Schema = new Schema({
  uuid: {
    type: String,
    required: true,
    unique: true,
  },
  orderId: {
    type: Number,
    required: true,
  },
  nominator: {
    type: String,
    required: false,
  },
  artist: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  anime: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
  },
  startSample: {
    type: Number,
    required: true,
  },
  sampleLength: {
    type: Number,
    required: true,
  },
  urlVideo: {
    type: String,
    required: true,
    unique: true,
  },
  urlAudio: {
    type: String,
    required: true,
    unique: true,
  },
});

export const SongModel = model<Song & Document>('Song', SongSchema);
