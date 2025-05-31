import { Router } from 'express';
import { register, login, getInfoUser, getUserById } from '../controllers/auth.controller';
import { validateJWT } from '../middlewares/validateJWT';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// protected
router.get('/me', validateJWT, getInfoUser);
router.get('/users/:id', validateJWT, getUserById);


export default router;
