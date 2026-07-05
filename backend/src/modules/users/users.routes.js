import express from 'express';
import * as usersController from './users.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorize.middleware.js';

const router = express.Router();

// All user management routes require the user to be logged in and be an ADMIN
router.use(protect);
router.use(requireRoles('ADMIN'));

router
  .route('/')
  .get(usersController.getUsers)
  .post(usersController.createUser);

router
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser);

router
  .route('/:id/status')
  .patch(usersController.updateUserStatus);

export default router;
