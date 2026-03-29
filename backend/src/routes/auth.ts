import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authValidators, runValidation } from '../middlewares/validation';

const router = Router();

router.post('/register', authValidators, runValidation, authController.register);
router.post('/login', authValidators, runValidation, authController.login);
router.get('/me', authController.authenticatedUser);

export default router;
