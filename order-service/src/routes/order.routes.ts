import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { validateJWT } from '../middlewares/validateJWT';

const router = Router();

// Semua butuh auth
router.post('/', validateJWT, OrderController.createOrder);
router.get('/', validateJWT, OrderController.getOrders);
router.get('/:id', validateJWT, OrderController.getOrderById);
router.put('/:id', validateJWT, OrderController.updateOrder);
router.delete('/:id', validateJWT, OrderController.deleteOrder);

export default router;
