import { Router } from 'express';
import * as aimController from '../controllers/aim.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateAimRequest } from '../middleware/validation.middleware';

const router = Router();

router.post(
  '/process',
  [authMiddleware, validateAimRequest],
  aimController.processAim,
);
router.get('/info', aimController.getDocumentInfo);
router.get('/ast/:content', aimController.getDocumentAST);
router.post('/abort/:requestId', aimController.abortRequest);
router.get('/status/:requestId', aimController.getRequestStatus);

export default router;
