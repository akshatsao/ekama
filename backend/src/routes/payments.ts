import express from "express";
import customerPayments from "./customer/payments";

import adminOrders from "./admin/orders";

const router = express.Router();

router.use('/admin/orders', adminOrders);
router.use(customerPayments);

export default router;
