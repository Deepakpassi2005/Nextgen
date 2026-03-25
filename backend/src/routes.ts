import { Router, Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import teacherRoutes from './routes/teacher';
import studentRoutes from './routes/student';
import chatRoutes from './routes/chat';
import publicRoutes from './routes/public';
import userRoutes from './routes/userRoutes';
import { initializeSocketIO } from './services/activityService';

export async function registerRoutes(
  httpServer: HttpServer,
  app: Express
): Promise<HttpServer> {
  const router = Router();

  // mount modular routers under /api prefix
  router.use('/auth', authRoutes);
  router.use('/admin', adminRoutes);
  router.use('/teacher', teacherRoutes);
  router.use('/student', studentRoutes);
  router.use('/chat', chatRoutes);
  router.use('/user', userRoutes);
  router.use('/', publicRoutes);

  app.use('/api', router);

  // attach socket.io for chat and real-time notifications
  const allowedSocketOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5002',
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter(Boolean);

  const io = new IOServer(httpServer, {
    cors: {
      origin: allowedSocketOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
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