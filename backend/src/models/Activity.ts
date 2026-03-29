import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  type: 'class_created' | 'class_updated' | 'class_deleted' | 
        'student_created' | 'student_updated' | 'student_deleted' |
        'teacher_created' | 'teacher_updated' | 'teacher_deleted' |
        'notice_created' | 'notice_updated' | 'notice_published' |
        'notice_deleted' |
        // subject events
        'subject_created' | 'subject_updated' | 'subject_deleted' |
        // timetable configuration events
        'timetable_config_created' | 'timetable_config_updated' |
        'other';
  title: string;
  description: string;
  userId?: mongoose.Types.ObjectId | string;
  userName: string;
  relatedId?: string;
  relatedType?: string; // 'class', 'student', 'teacher', 'notice'
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: [
        'class_created', 'class_updated', 'class_deleted',
        'student_created', 'student_updated', 'student_deleted',
        'teacher_created', 'teacher_updated', 'teacher_deleted',
        'notice_created', 'notice_updated', 'notice_published',
        'notice_deleted',
        // add subjects
        'subject_created', 'subject_updated', 'subject_deleted',
        // timetable configuration events
        'timetable_config_created', 'timetable_config_updated',
        'other'
      ],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    userId: { type: Schema.Types.Mixed, required: false },
    userName: { type: String, required: true },
    relatedId: { type: String, default: null },
    relatedType: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
