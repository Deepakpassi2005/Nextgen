# NextGen: Asset & Academic Management System - Project Report

## 1. Project Overview
Project **NextGen** is a comprehensive mobile and web-based educational ecosystem designed to streamline academic administration, student engagement, and resource management. It provides specialized interfaces for Students, Teachers, and Administrators, backed by a robust real-time backend.

---

## 2. Technical Architecture
- **Frontend**: React Native (Expo SDK 51)
  - **Theming**: Custom design system with glassmorphism and modern aesthetics.
  - **Navigation**: React Navigation (Stacks, Tabs).
  - **State Management**: Zustand / React Context.
- **Backend**: Node.js & Express (TypeScript)
  - **Database**: Drizzle ORM (PostgreSQL/SQL-ready).
  - **Real-time**: Socket.io for messaging and live notifications.
- **Communication**: RESTful API + WebSockets.
- [x] Fix Foreground Notification Display (Show alert even if app is open)
- [x] Fix Push Notification Delivery Flow
    - [x] Switch frontend to `getDevicePushTokenAsync` (FCM)
    - [x] Verify delivery in backend logs
- **Notifications**: Expo Notifications (FCM for Android).

---

## 3. Panels & Key Features

### 🎓 Student Panel
Designed for an intuitive academic experience:
- **Smart Dashboard**: Real-time stats and upcoming schedule highlights.
- **Digital Timetable**: Access to daily and weekly class schedules.
- **Quiz Hub**: Attempt interactive quizzes with automatic result generation.
- **Study Materials**: Centralized repository for downloading course PDFs and documents.
- **Work & Assignments**: View tasks, track deadlines, and submit work digitally.
- **Academic Results**: Detailed breakdown of performance across subjects.
- **Notice Board**: View tagged announcements and notifications with attachments.

### 👩‍🏫 Teacher Panel
Powerful management tools for educators:
- **Management Tools Grid**: High-efficiency access to all administrative tasks.
- **Attendance System**: Quick-mark student attendance for specific classes/subjects.
- **Resource Management**: Upload and categorize study materials with file attachments.
- **Quiz Creator**: Design and assign quizzes to specific student groups.
- **Assignment Tracker**: Set task deadlines and review student submissions.
- **Grading & Results**: Manage student marks and generate performance reports.
- **Real-time Messaging**: Direct communication channel with students/staff.
- **Staff Punching**: Integrated check-in/out tracking for staff attendance.
- **Announcements**: Broadcast notices to entire classes or specific levels.

### 🛡️ Admin Panel (Backend/Internal)
Core system management:
- **User Orchestration**: Management of student and teacher accounts.
- **Timetable Configuration**: Setting up the academic calendar and schedules.
- **System Integrity**: Audit logs and activity tracking across all panels.

---

## 4. Database Schema (Drizzle Models)
The system uses a highly relational data model to ensure data integrity:
- **Identity**: `User`, `Student`, `Teacher`.
- **Academics**: `Class`, `Subject`, `Timetable`, `TimetableConfig`.
- **Learning**: `StudyMaterial`, `Assignment`, `AssignmentSubmission`.
- **Evaluation**: `Quiz`, `QuizSubmission`, `Result`, `Marks`.
- **Operations**: `Attendance`, `TeacherAttendance`, `PunchLog`, `AuditLog`.
- **Engagement**: `Notice`, `Notification`, `Message`, `Activity`.

---

## 5. System Connections & Integration
- **API Strategy**: Centralized Axios client with interceptors for auth and error handling.
- **Media Storage**: Backend-hosted storage for study materials, assignments, and profile photos.
- **Real-time Engine**: Socket server handling "joinRoom" logic for private and group interactions.
- **Native Sync**: Local storage (AsyncStorage) for offline preferences and "seen" status tracking.

---

## 6. Current Development Status
- **Current SDK**: **51.0.38** (Stabilized for maximum device compatibility).
- **Environment**: Development build via EAS (Android).
- **Ready for**: Push notification testing and full-scale academic deployment.
