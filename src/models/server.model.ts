import { Document, Schema, model } from "mongoose";

import { Server } from "@/interfaces/server.interface";

const ServerSchema: Schema = new Schema({
  name: { type: String, required: true },
  discordId: { type: String, required: true },
  threadsId: { type: String, required: true },
  announceId: { type: String, required: true },
  roleId: { type: String, required: true },
});

export const ServerModel = model<Server & Document>('Server', ServerSchema)
