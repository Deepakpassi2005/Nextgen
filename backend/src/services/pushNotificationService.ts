import * as admin from 'firebase-admin';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';

interface PushMessage {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

class PushNotificationService {
  private fcm: admin.app.App | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (process.env.FCM_PROJECT_ID && process.env.FCM_PRIVATE_KEY && process.env.FCM_CLIENT_EMAIL) {
      try {
        this.fcm = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FCM_PROJECT_ID,
            privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FCM_CLIENT_EMAIL,
          }),
        }, 'push-notifications');
        this.isInitialized = true;
        console.log('Firebase Admin SDK initialized for push notifications');
      } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
      }
    } else {
      console.warn('FCM credentials missing in environment. Push notifications will be logged only.');
    }
  }

  async sendToStudent(studentId: string, message: PushMessage) {
    try {
      const student = await Student.findById(studentId);
      if (student && student.fcmToken) {
        if (this.isInitialized && this.fcm) {
          await this.fcm.messaging().send({
            token: student.fcmToken,
            notification: {
              title: message.title,
              body: message.body,
            },
            data: message.data,
          });
          console.log(`[push] Sent to student ${studentId}:`, message.title);
        } else {
          console.log(`[push-mock] To student ${studentId}:`, message);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error sending push to student:', error);
      return { success: false, error };
    }
  }

  async sendToTeacher(teacherId: string, message: PushMessage) {
    try {
      const teacher = await Teacher.findById(teacherId);
      if (teacher && teacher.fcmToken) {
        if (this.isInitialized && this.fcm) {
          await this.fcm.messaging().send({
            token: teacher.fcmToken,
            notification: {
              title: message.title,
              body: message.body,
            },
            data: message.data,
          });
          console.log(`[push] Sent to teacher ${teacherId}:`, message.title);
        } else {
          console.log(`[push-mock] To teacher ${teacherId}:`, message);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error sending push to teacher:', error);
      return { success: false, error };
    }
  }

  async sendToClass(classId: string, message: PushMessage) {
    try {
      const students = await Student.find({ classId, status: 'active' });
      const tokens = students
        .map(s => s.fcmToken)
        .filter(token => token && token.length > 0) as string[];

      if (tokens.length > 0) {
        if (this.isInitialized && this.fcm) {
          await this.fcm.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: message.title,
              body: message.body,
            },
            data: message.data,
          });
          console.log(`[push] Sent bulk to ${tokens.length} students in class ${classId}:`, message.title);
        } else {
          console.log(`[push-mock] To class ${classId} (${tokens.length} devices):`, message);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error sending push to class:', error);
      return { success: false, error };
    }
  }

  async sendToAllAudience(audience: 'all' | 'students' | 'teachers', message: PushMessage) {
    try {
      let tokens: string[] = [];
      
      if (audience === 'all' || audience === 'students') {
        const studentTokens = await Student.find({ status: 'active', fcmToken: { $exists: true, $ne: '' } }).distinct('fcmToken');
        tokens = tokens.concat(studentTokens);
      }
      
      if (audience === 'all' || audience === 'teachers') {
        const teacherTokens = await Teacher.find({ status: 'active', fcmToken: { $exists: true, $ne: '' } }).distinct('fcmToken');
        tokens = tokens.concat(teacherTokens);
      }

      const uniqueTokens = Array.from(new Set(tokens.filter(t => t)));

      if (uniqueTokens.length > 0) {
        if (this.isInitialized && this.fcm) {
          // Firebase milticast limit is 500, so we chunk it just in case
          const chunks = [];
          for (let i = 0; i < uniqueTokens.length; i += 500) {
            chunks.push(uniqueTokens.slice(i, i + 500));
          }
          
          for (const chunk of chunks) {
            await this.fcm.messaging().sendEachForMulticast({
              tokens: chunk,
              notification: {
                title: message.title,
                body: message.body,
              },
              data: message.data,
            });
          }
          console.log(`[push] Sent bulk to ${uniqueTokens.length} devices (${audience}):`, message.title);
        } else {
          console.log(`[push-mock] To ${audience} (${uniqueTokens.length} devices):`, message);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error sending bulk push:', error);
      return { success: false, error };
    }
  }
}

export const pushNotificationService = new PushNotificationService();

export const sendToStudent = (studentId: string, message: PushMessage) =>
  pushNotificationService.sendToStudent(studentId, message);

export const sendToTeacher = (teacherId: string, message: PushMessage) =>
  pushNotificationService.sendToTeacher(teacherId, message);

export const sendToClass = (classId: string, message: PushMessage) =>
  pushNotificationService.sendToClass(classId, message);

export const sendToAllAudience = (audience: 'all' | 'students' | 'teachers', message: PushMessage) =>
  pushNotificationService.sendToAllAudience(audience, message);