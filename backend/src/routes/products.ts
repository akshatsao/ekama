import express from 'express';
import adminProducts from './admin/products';
import customerProducts from './customer/products';

const router = express.Router();

router.use(customerProducts);
router.use(adminProducts);

export default router;
