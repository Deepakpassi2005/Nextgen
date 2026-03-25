import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyMaterial extends Document {
  title: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  attachments: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
  // Deprecated fields for single-file (kept for migration safety)
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  downloads: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema = new Schema<IStudyMaterial>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    attachments: [{
      fileUrl: { type: String, required: true },
      fileName: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, default: 0 }
    }],
    // Keep single file fields as optional for legacy data
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    downloads: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for efficient queries
StudyMaterialSchema.index({ classId: 1 });
StudyMaterialSchema.index({ subjectId: 1 });
StudyMaterialSchema.index({ teacherId: 1 });
StudyMaterialSchema.index({ isActive: 1 });

export const StudyMaterial = mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);
