import { Router } from 'express';
import * as storageController from '../controllers/storage.controller';
import { authMiddleware } from '../middleware/auth.middleware';
// TODO: add middleware to check limits to uploads

const router = Router();

router.post('/upload', authMiddleware, async (req, res, next) => {
  await storageController.uploadFile(req, res, next);
});

router.get('/list/:bucketId', authMiddleware, async (req, res, next) => {
  await storageController.listBucketContents(req, res, next);
});

router.get('/download/:objectKey', authMiddleware, async (req, res, next) => {
  await storageController.getFile(req, res, next);
});

// router.post('/clear', authMiddleware, async (req, res, next) => {
//     await storageController.clearBucketHandler(req, res, next);
// });

export default router;
