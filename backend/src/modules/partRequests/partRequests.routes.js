import express from 'express';
import * as partRequestsController from './partRequests.controller.js';
import { 
  createPartRequestSchema, 
  updatePartRequestStatusSchema, 
  queryPartRequestsSchema 
} from './partRequests.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(
    requireRoles('TECHNICIAN', 'SUPERVISOR'),
    validateRequest(createPartRequestSchema),
    partRequestsController.createPartRequest
  )
  .get(
    requireRoles('ADMIN', 'SUPERVISOR', 'STORE', 'TECHNICIAN'),
    validateRequest(queryPartRequestsSchema, 'query'),
    partRequestsController.getPartRequests
  );

router
  .route('/:id')
  .get(
    requireRoles('ADMIN', 'SUPERVISOR', 'STORE', 'TECHNICIAN'),
    partRequestsController.getPartRequestById
  );

router
  .route('/:id/status')
  .patch(
    requireRoles('ADMIN', 'SUPERVISOR', 'STORE'),
    validateRequest(updatePartRequestStatusSchema),
    partRequestsController.updateRequestStatus
  );

export default router;
