import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId: mongoose.Types.ObjectId;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // CREATE, UPDATE, DELETE, LOGIN, etc.
    entity: { type: String, required: true }, // Student, Teacher, Class, etc.
    entityId: { type: Schema.Types.ObjectId, required: true },
    oldData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index for efficient queries
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);