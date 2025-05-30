import { Router } from 'express';
import * as BookController from '../controllers/book.controller';
import { validateJWT } from '../middlewares/validateJWT'; // reuse dari Auth Service

const router = Router();

router.get('/', BookController.getAll);
router.get('/:id', validateJWT, BookController.getById);
router.post('/', validateJWT, BookController.create);
router.put('/:id', validateJWT, BookController.update);
router.delete('/:id', validateJWT, BookController.softDelete);

export default router;
