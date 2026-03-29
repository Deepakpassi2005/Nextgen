import { Router } from 'express';
import * as userCtrl from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.put('/fcm-token', authMiddleware, userCtrl.registerFcmToken);

export default router;
