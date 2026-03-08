import express from 'express';
import adminUsers from './admin/users';
import customerUsers from './customer/users';

const router = express.Router();

router.use(customerUsers);
router.use(adminUsers);

export default router;

