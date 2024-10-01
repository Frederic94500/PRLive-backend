import { Document, Schema, model } from 'mongoose';

import { User } from '@interfaces/user.interface';

const UserSchema: Schema = new Schema({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  role: { type: String, required: true },
  server: { type: String, enum: ['EU', 'NA1', 'NA2'], default: 'EU', required: true },
});

export const UserModel = model<User & Document>('User', UserSchema);
