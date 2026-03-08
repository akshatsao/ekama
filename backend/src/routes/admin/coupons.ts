import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeAdmin } from '../../middleware/auth';
import { getCouponsCollection } from '../../utils/database';

const router = express.Router();

// Get all coupons
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const couponsCollection = getCouponsCollection();
        const coupons = await couponsCollection.find({}).sort({ createdAt: -1 }).toArray();
        return res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return res.status(500).json({ error: 'Failed to fetch coupons.' });
    }
});

// Create a new coupon
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { code, discountType, discountValue, minCartValue, isActive } = req.body;

        if (!code || !discountType || discountValue === undefined) {
            return res.status(400).json({ error: 'Missing required coupon fields.' });
        }

        const couponsCollection = getCouponsCollection();

        // Check if code already exists
        const existingCoupon = await couponsCollection.findOne({ code: code.trim().toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ error: 'A coupon with this code already exists.' });
        }

        const newCoupon = {
            id: uuidv4(),
            code: code.trim().toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            minCartValue: Number(minCartValue) || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await couponsCollection.insertOne(newCoupon);
        return res.status(201).json(newCoupon);
    } catch (error) {
        console.error('Error creating coupon:', error);
        return res.status(500).json({ error: 'Failed to create coupon.' });
    }
});

// Update an existing coupon
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discountType, discountValue, minCartValue, isActive } = req.body;
        const couponsCollection = getCouponsCollection();

        if (code) {
            // ensure code is unique if changed
            const existingCoupon = await couponsCollection.findOne({ code: code.trim().toUpperCase() });
            if (existingCoupon && existingCoupon.id !== id) {
                return res.status(400).json({ error: 'A coupon with this code already exists.' });
            }
        }

        const updates: any = { updatedAt: new Date() };
        if (code !== undefined) updates.code = code.trim().toUpperCase();
        if (discountType !== undefined) updates.discountType = discountType;
        if (discountValue !== undefined) updates.discountValue = Number(discountValue);
        if (minCartValue !== undefined) updates.minCartValue = Number(minCartValue);
        if (isActive !== undefined) updates.isActive = isActive;

        const result = await couponsCollection.findOneAndUpdate(
            { id },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ error: 'Coupon not found.' });
        }

        return res.json(result);
    } catch (error) {
        console.error('Error updating coupon:', error);
        return res.status(500).json({ error: 'Failed to update coupon.' });
    }
});

// Delete a coupon
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const couponsCollection = getCouponsCollection();

        const result = await couponsCollection.deleteOne({ id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Coupon not found.' });
        }

        return res.json({ message: 'Coupon deleted successfully.' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return res.status(500).json({ error: 'Failed to delete coupon.' });
    }
});

export default router;
