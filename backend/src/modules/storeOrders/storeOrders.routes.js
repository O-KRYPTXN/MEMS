import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import * as storeOrdersController from './storeOrders.controller.js';
import { createStoreOrderSchema, updateStoreOrderStatusSchema, updateSupplierResponseSchema } from './storeOrders.validation.js';

const router = express.Router();

router.use(protect);
router.use(requireRoles('ADMIN', 'STORE'));

router.post(
  '/',
  validateRequest(createStoreOrderSchema),
  storeOrdersController.createStoreOrderHandler
);

router.get(
  '/',
  storeOrdersController.getStoreOrdersHandler
);

router.get(
  '/:id',
  storeOrdersController.getStoreOrderByIdHandler
);

router.patch(
  '/:id/status',
  validateRequest(updateStoreOrderStatusSchema),
  storeOrdersController.updateStoreOrderStatusHandler
);

router.patch(
  '/:id/supplier-response',
  validateRequest(updateSupplierResponseSchema),
  storeOrdersController.updateSupplierResponseHandler
);

export default router;
