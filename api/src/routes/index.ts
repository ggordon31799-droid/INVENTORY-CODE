import { Router } from 'express';
import { getHealth } from '../controllers/healthController';
import productRoutes from './products';
import purchaseOrderRoutes from './purchaseOrders';
import orderRoutes from './orders';
import inventoryActionRoutes from './inventoryActions';
import dashboardRoutes from './dashboard';
import receiptRoutes from './receipts';
import manualOutboundRoutes from './manualOutbound';

const router = Router();

router.get('/health', getHealth);
router.use('/products', productRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/receipts', receiptRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory-actions', inventoryActionRoutes);
router.use('/manual-outbound', manualOutboundRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
