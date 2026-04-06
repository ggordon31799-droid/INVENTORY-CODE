import { Router } from 'express';
import * as ctrl from '../controllers/inventoryControlController';

const router = Router();

router.post('/', ctrl.createCycleCount);
router.get('/', ctrl.listCycleCounts);
router.get('/:id', ctrl.getCycleCount);
router.patch('/:id/lines/:lineId', ctrl.updateCountLine);
router.post('/:id/review', ctrl.reviewCount);
router.post('/:id/finalize', ctrl.finalizeCount);

export default router;
