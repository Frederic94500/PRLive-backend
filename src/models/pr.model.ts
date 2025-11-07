import { Document, Schema, model } from 'mongoose';

import { NominationModel } from './nomination.model';
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
  status: {
    type: String,
    required: true,
  },
  nomination: {
    type: NominationModel.schema,
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
    required: false,
  },
  serverId: {
    type: String,
    required: true,
  },
  mandatoryGSheet: {
    type: Boolean,
    required: false,
  },
  video: {
    type: String,
    required: false,
  },
  affinityImage: {
    type: String,
    required: false,
  },
  prStats: {
    type: String,
    required: false,
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
        source: {
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
    required: false,
  },
});

export const PRModel = model<PR & Document>('PR', PRSchema);
