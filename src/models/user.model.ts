import { Document, Schema, model } from 'mongoose';

import { User } from '@interfaces/user.interface';

const UserSchema: Schema = new Schema({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
});

export const UserModel = model<User & Document>('User', UserSchema);
