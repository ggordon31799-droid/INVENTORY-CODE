import { Router } from 'express';
import * as ctrl from '../controllers/productController';

const router = Router();

router.get('/', ctrl.listProducts);
router.get('/lookup', ctrl.lookupByBarcode);
router.get('/:id', ctrl.getProduct);
router.post('/', ctrl.createProduct);
router.patch('/:id', ctrl.updateProduct);
router.get('/:id/cost-history', ctrl.getCostHistory);
router.get('/:id/ledger', ctrl.getLedger);
router.get('/:id/mappings', ctrl.getMappings);
router.post('/:id/mappings', ctrl.addMapping);
router.delete('/:id/mappings/:mappingId', ctrl.deleteMapping);

export default router;
