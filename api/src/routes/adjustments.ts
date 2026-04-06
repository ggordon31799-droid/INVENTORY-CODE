import { Router } from 'express';
import * as ctrl from '../controllers/inventoryControlController';

const router = Router();

router.post('/', ctrl.confirmAdjustment);
router.get('/', ctrl.listAdjustments);
router.get('/:id', ctrl.getAdjustment);

export default router;
