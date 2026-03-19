import { Router } from 'express';
import { googleAuth, login, logout, me, register } from '@/controllers/auth.controller';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/google', googleAuth);
authRouter.post('/logout', logout);
authRouter.get('/me', me);

export default authRouter;
