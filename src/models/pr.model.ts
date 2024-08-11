import { Document, Schema, model } from 'mongoose';

import { PR } from '@/interfaces/pr.interface';
import { SongModel } from './song.model';

const PRSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  creator: {
    type: String,
    required: true,
  },
  nomination: {
    type: Boolean,
    required: true,
  },
  blind: {
    type: Boolean,
    required: true,
  },
  deadline: {
    type: Number,
    required: true,
  },
  songList: {
    type: [
      {
        uuid: {
          type: String,
          required: true,
          unique: true,
        },
        orderId: {
          type: Number,
          required: true,
        },
        nominatedId: {
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
        },
        urlAudio: {
          type: String,
          required: true,
        },
      },
    ],
    required: true,
  },
});

export const PRModel = model<PR & Document>('PR', PRSchema);
