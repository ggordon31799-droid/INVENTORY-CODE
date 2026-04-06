import { Router } from 'express';
import * as ctrl from '../controllers/manualOutboundController';

const router = Router();

router.get('/damaged-report', ctrl.getDamagedReport);
router.get('/', ctrl.listOutbound);
router.get('/:id', ctrl.getOutbound);
router.post('/', ctrl.confirmOutbound);
router.patch('/:id/claim-status', ctrl.updateClaimStatus);
router.patch('/:id/credit', ctrl.applyCredit);

export default router;
