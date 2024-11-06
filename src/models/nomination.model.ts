import { Document, Schema, model } from "mongoose";

import { Nomination } from "@/interfaces/nomination.interface";

const NominationSchema = new Schema({
  prId: {
    type: String,
    required: false,
  },
  hidden: {
    type: Boolean,
    required: true,
  },
  blind: {
    type: Boolean,
    required: true,
  },
  hideNominatedSongList: {
    type: Boolean,
    required: true,
  },
  deadlineNomination: {
    type: Date,
    required: true,
  },
  endNomination: {
    type: Boolean,
    required: true,
  },
  songPerUser: {
    type: Number,
    required: true,
  },
  nominatedSongList: {
    type: [
      {
        uuid: {
          type: String,
          required: true,
        },
        nominatedId: {
          type: String,
          required: true,
        },
        at: {
          type: Date,
          required: true,
        },
      },
    ],
    required: false,
  },
});

export const NominationModel = model<Nomination & Document>('Nomination', NominationSchema);