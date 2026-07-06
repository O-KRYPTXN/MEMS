import express from 'express';
import * as partsController from './parts.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { createPartSchema, updatePartSchema, queryPartsSchema } from './parts.validation.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(
    requireRoles('ADMIN', 'SUPERVISOR', 'STORE', 'TECHNICIAN'),
    validateRequest(queryPartsSchema, 'query'),
    partsController.getParts
  )
  .post(
    requireRoles('ADMIN', 'SUPERVISOR', 'STORE'),
    validateRequest(createPartSchema),
    partsController.createPart
  );

router
  .route('/:id')
  .get(
    requireRoles('ADMIN', 'SUPERVISOR', 'STORE', 'TECHNICIAN'),
    partsController.getPart
  )
  .patch(
    requireRoles('ADMIN', 'SUPERVISOR', 'STORE'),
    validateRequest(updatePartSchema),
    partsController.updatePart
  )
  .delete(
    requireRoles('ADMIN'),
    partsController.deletePart
  );

export default router;
