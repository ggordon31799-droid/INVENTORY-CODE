import { Router } from 'express';
import * as ctrl from '../controllers/dashboardController';

const router = Router();

router.get('/summary', ctrl.getSummary);
router.get('/alerts', ctrl.getAlerts);
router.get('/activity', ctrl.getActivity);
router.get('/todays-work', ctrl.getTodaysWork);

export default router;
