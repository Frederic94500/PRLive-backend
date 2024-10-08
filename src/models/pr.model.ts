import { Document, Schema, model } from 'mongoose';

import { PR } from '@/interfaces/pr.interface';

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
  deadlineNomination: {
    type: Date,
    required: false,
  },
  deadline: {
    type: Date,
    required: true,
  },
  finished: {
    type: Boolean,
    required: true,
  },
  hashKey: {
    type: String,
    required: true,
  },
  numberSongs: {
    type: Number,
    required: true,
  },
  mustBe: {
    type: Number,
    required: true,
  },
  threadId: {
    type: String,
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
          required: false,
        },
        urlVideo: {
          type: String,
          required: false,
        },
        urlAudio: {
          type: String,
          required: false,
        },
        tiebreak: {
          type: Number,
          required: true,
        },
      },
    ],
    required: true,
  },
});

export const PRModel = model<PR & Document>('PR', PRSchema);
