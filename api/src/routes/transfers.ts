import { Router } from 'express';
import * as ctrl from '../controllers/inventoryControlController';

const router = Router();

router.post('/', ctrl.confirmTransfer);
router.get('/', ctrl.listTransfers);

export default router;
