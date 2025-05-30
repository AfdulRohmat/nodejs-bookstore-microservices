import { Router } from 'express';
import { register, login, getInfoUser } from '../controllers/auth.controller';
import { validateJWT } from '../middlewares/validateJWT';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// protected
router.get('/me', validateJWT, getInfoUser);

export default router;
