import { Document, Schema, model } from 'mongoose';

import { Sheet } from '@/interfaces/sheet.interface';

const SheetSchema = new Schema({
  prId: {
    type: String,
    required: true,
  },
  voterId: {
    type: String,
    required: true,
  },
  latestUpdate: {
    type: Date,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  sheet: {
    type: [
      {
        uuid: {
          type: String,
          required: true,
        },
        orderId: {
          type: Number,
          required: true,
        },
        rank: {
          type: Number,
          required: false,
        },
        score: {
          type: Number,
          required: false,
        },
      },
    ],
    required: true,
  },
});

export const SheetModel = model<Sheet & Document>('Sheet', SheetSchema);
