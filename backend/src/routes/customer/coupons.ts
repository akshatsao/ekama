import express from 'express';
import { getCouponsCollection } from '../../utils/database';

const router = express.Router();

// Validate a coupon code against a cart total
router.post('/validate', async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Coupon code is required.' });
        }

        const uppercaseCode = code.trim().toUpperCase();
        const couponsCollection = getCouponsCollection();

        const coupon = await couponsCollection.findOne({ code: uppercaseCode, isActive: true });

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid or inactive coupon code.' });
        }

        if (cartTotal !== undefined && cartTotal < coupon.minCartValue) {
            return res.status(400).json({
                error: `Minimum cart value of ₹${coupon.minCartValue} is required to apply this coupon.`
            });
        }

        // Return the discount information so the frontend can calculate
        return res.json({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        return res.status(500).json({ error: 'Failed to validate coupon.' });
    }
});

export default router;
