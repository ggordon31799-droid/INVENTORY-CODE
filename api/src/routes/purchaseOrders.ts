import { Router } from 'express';
import * as ctrl from '../controllers/purchaseOrderController';

const router = Router();

router.get('/', ctrl.listPurchaseOrders);
router.get('/:id', ctrl.getPurchaseOrder);
router.post('/', ctrl.createPurchaseOrder);
router.patch('/:id', ctrl.updatePurchaseOrder);
router.post('/:id/close', ctrl.closePurchaseOrder);
router.patch('/:id/void', ctrl.voidPurchaseOrder);
router.post('/:id/receive', ctrl.confirmReceipt);
router.get('/:id/receipts', ctrl.getReceiptsForPO);

export default router;
