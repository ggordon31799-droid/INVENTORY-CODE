import { Router } from 'express';
import { getReceipt } from '../controllers/purchaseOrderController';

const router = Router();

router.get('/:id', getReceipt);

export default router;
