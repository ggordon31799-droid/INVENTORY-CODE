import { Router } from 'express';
import * as ctrl from '../controllers/orderController';

const router = Router();

// Static routes MUST come before parameterized routes
router.get('/today', ctrl.getTodaysOrders);
router.get('/scan-lookup', ctrl.scanLookup);
router.post('/sync', ctrl.syncOrders);
router.post('/batch-ship', ctrl.batchShip);

router.get('/', ctrl.listOrders);
router.get('/:id', ctrl.getOrder);
router.post('/', ctrl.createOrder);
router.patch('/:id/cancel', ctrl.cancelOrder);
router.post('/:id/ship', ctrl.confirmShipment);
router.get('/:id/shipments', ctrl.getShipmentsForOrder);
router.patch('/:orderId/lines/:lineId/resolve', ctrl.resolveLineItem);

export default router;
