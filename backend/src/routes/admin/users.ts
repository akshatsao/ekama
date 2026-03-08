import bcrypt from 'bcryptjs';
import express from 'express';
import { ApiResponse } from '../../types';
import { getUsersCollection } from '../../utils/database';

const router = express.Router();

type UserDoc = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'customer';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

router.post('/make-admin', (req, res) => {
  const users = getUsersCollection();
  const { email, adminKey, password } = req.body || {};
  const setupKey = process.env.ADMIN_SETUP_KEY;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!setupKey) {
    res.status(500).json({
      success: false,
      error: 'Admin setup key not configured'
    } as ApiResponse<null>);
    return;
  }

  const rawEmail = typeof email === 'string' ? email.trim() : '';
  const normalizedEmail = rawEmail.toLowerCase();

  if (!rawEmail || !adminKey) {
    res.status(400).json({
      success: false,
      error: 'Email and admin key are required'
    } as ApiResponse<null>);
    return;
  }

  if (adminKey !== setupKey) {
    res.status(403).json({
      success: false,
      error: 'Invalid admin key'
    } as ApiResponse<null>);
    return;
  }

  const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  users.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } })
    .then(async (userRow: UserDoc | null) => {
      const now = new Date();
      if (userRow) {
        const updates: Partial<UserDoc> = {
          email: normalizedEmail,
          role: 'admin',
          isActive: true,
          updatedAt: now
        };
        const effectivePassword = adminPassword || (typeof password === 'string' ? password : '');
        if (effectivePassword) {
          updates.password = await bcrypt.hash(effectivePassword, 10);
        }
        await users.updateOne({ id: userRow.id }, { $set: updates });
        res.json({
          success: true,
          message: userRow.role === 'admin' ? 'Admin updated' : 'User promoted to admin'
        } as ApiResponse<null>);
        return;
      }

      const createPassword = adminPassword || (typeof password === 'string' ? password : '');
      if (!createPassword) {
        res.status(500).json({
          success: false,
          error: 'ADMIN_PASSWORD not configured'
        } as ApiResponse<null>);
        return;
      }

      const hashedPassword = await bcrypt.hash(createPassword, 10);
      const newUser: UserDoc = {
        id: Math.random().toString(36).substring(2, 15),
        email: normalizedEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: '',
        role: 'admin',
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      await users.insertOne(newUser);
      res.status(201).json({
        success: true,
        message: 'Admin account created'
      } as ApiResponse<null>);
    })
    .catch((err: unknown) => {
      console.error('Error updating user role:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update user role'
      } as ApiResponse<null>);
    });
});

export default router;
