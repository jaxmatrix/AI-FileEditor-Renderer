import mongoose, { Schema, Document } from 'mongoose';
import { HistoryLog } from '../core/VersionControl';

export interface IContext extends Document {
  fileId: string;
  userId: string;
  history: HistoryLog;
  currentFileState: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContextSchema = new Schema<IContext>({
  fileId: { type: String, required: true },
  userId: { type: String, required: true },
  history: { type: Object, required: true },
  currentFileState: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ContextSchema.index({ userId: 1, fileId: 1 }, { unique: true });

export const Context = mongoose.model<IContext>('Context', ContextSchema);