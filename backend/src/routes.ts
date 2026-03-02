import { Router, Express } from 'express';
import { createServer, Server } from 'http';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import teacherRoutes from './routes/teacher';
import studentRoutes from './routes/student';
import chatRoutes from './routes/chat';
import publicRoutes from './routes/public';
import { initializeSocketIO } from './services/activityService';

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const router = Router();

  // mount modular routers under /api prefix
  router.use('/auth', authRoutes);
  router.use('/admin', adminRoutes);
  router.use('/teacher', teacherRoutes);
  router.use('/student', studentRoutes);
  router.use('/chat', chatRoutes);
  router.use('/', publicRoutes);

  app.use('/api', router);

  // attach socket.io for chat and real-time notifications
  const io = require('socket.io')(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
    },
  });

  // Initialize Socket.io for activity notifications
  initializeSocketIO(io);

  io.on('connection', (socket: any) => {
    console.log('socket connected', socket.id);

    socket.on('joinRoom', ({ room }) => {
      socket.join(room);
    });

    socket.on('message', (msg: any) => {
      io.to(msg.room).emit('message', msg);
    });
  });

  return httpServer;
}