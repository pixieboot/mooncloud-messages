import { Router } from 'express';
const router = Router();

import { mainRouter } from './main.router.js';
import { discordRouter } from './discord.router.js';
import { loginRouter } from './login.router.js';
import { logoutRouter } from './logout.router.js';
import { localSignupRouter } from './signup.router.js';
import { userRouter } from './user.router.js';

router.use('/', mainRouter);
router.use('/auth/login', loginRouter);
router.use('/auth/logout', logoutRouter);
router.use('/auth/signup', localSignupRouter);
router.use('/auth/signup/discord', discordRouter);
router.use('/user', userRouter);

export default router;
