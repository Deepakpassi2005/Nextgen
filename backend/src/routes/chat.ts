import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import * as chatCtrl from '../controllers/chat/chatController';

const router = Router();
router.use(authMiddleware); // everyone who is logged in can chat

// class chat available to teachers and students; admin may also view
router.get('/class/:classId', roleMiddleware(['teacher','student','admin']), chatCtrl.getClassChat);
router.post('/class/send', roleMiddleware(['teacher','student']), chatCtrl.sendClassMessage);

// personal chat between any two authenticated users
router.get('/personal/:userId', chatCtrl.getPersonalChat);
router.post('/personal/send', chatCtrl.sendPersonalMessage);

export default router;