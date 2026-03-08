import express from 'express';
import adminCollections from './admin/collections';
import customerCollections from './customer/collections';

const router = express.Router();

router.use(customerCollections);
router.use(adminCollections);

export default router;
