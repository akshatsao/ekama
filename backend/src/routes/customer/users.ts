import bcrypt from 'bcryptjs';
import express from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { ApiResponse } from '../../types';
import { getUsersCollection } from '../../utils/database';

const router = express.Router();

// Debug: log raw body for address routes
router.use('/addresses', express.json(), (req, res, next) => {
  console.log('[addresses middleware] method:', req.method, 'raw body:', JSON.stringify(req.body, null, 2));
  next();
});

type AuthTokenPayload = {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
  iat?: number;
  exp?: number;
};

type AuthenticatedRequest = express.Request & { user: AuthTokenPayload };

type AddressDoc = {
  id: string;
  label: 'HOME' | 'WORK';
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  addressLine: string;
  city: string;
  state: string;
  landmark?: string;
  altPhone?: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserDoc = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'customer';
  isActive: boolean;
  addresses?: AddressDoc[];
  wishlist?: string[];
  createdAt: Date;
  updatedAt: Date;
};
type AuthResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'admin' | 'customer';
  };
  token: string;
};

const normalizeString = (value: unknown) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const resolveString = (body: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = normalizeString(body[key]);
    if (value) return value;
  }
  return '';
};

router.post('/register', async (req, res) => {
  const users = getUsersCollection();
  const { email, password, firstName, lastName, phone } = req.body;

  const rawEmail = typeof email === 'string' ? email.trim() : '';
  const normalizedEmail = rawEmail.toLowerCase();

  if (!rawEmail || !password || !firstName || !phone) {
    res.status(400).json({
      success: false,
      error: 'Email, password, first name, and phone are required'
    } as ApiResponse<null>);
    return;
  }

  try {
    const existingUser = await users.findOne({ $or: [{ email: normalizedEmail }, { email: rawEmail }] });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse<null>);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Math.random().toString(36).substring(2, 15);
    const now = new Date();
    const userDoc: UserDoc = {
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName: lastName || '',
      phone: phone,
      role: 'customer',
      isActive: true,
      addresses: [],
      wishlist: [],
      createdAt: now,
      updatedAt: now
    };

    await users.insertOne(userDoc);

    const token = jwt.sign(
      { userId, email: normalizedEmail, role: 'customer' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email: normalizedEmail,
          firstName,
          lastName: lastName || '',
          phone: phone,
          role: 'customer'
        },
        token
      },
      message: 'User registered successfully'
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process registration'
    } as ApiResponse<null>);
  }
});

router.post('/login', async (req, res) => {
  const users = getUsersCollection();
  const { email, password } = req.body;

  const rawEmail = typeof email === 'string' ? email.trim() : '';
  const normalizedEmail = rawEmail.toLowerCase();

  if (!rawEmail || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required'
    } as ApiResponse<null>);
    return;
  }

  try {
    const user = await users.findOne({
      $and: [
        { $or: [{ email: normalizedEmail }, { email: rawEmail }] },
        { isActive: { $ne: false } }
      ]
    });
    const userRow = user as UserDoc | null;
    if (!userRow) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse<null>);
      return;
    }

    const isPasswordValid = userRow.password
      ? await bcrypt.compare(password, userRow.password)
      : false;
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse<null>);
      return;
    }

    const token = jwt.sign(
      { userId: userRow.id, email: userRow.email, role: userRow.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.json({
      success: true,
      data: {
        user: {
          id: userRow.id,
          email: userRow.email,
          firstName: userRow.firstName,
          lastName: userRow.lastName,
          role: userRow.role
        },
        token
      },
      message: 'Login successful'
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    console.error('Error processing login:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process login'
    } as ApiResponse<null>);
  }
});

router.get('/addresses', authenticateToken, async (req, res) => {
  const users = getUsersCollection();
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  try {
    const userRow = (await users.findOne({ id: userId })) as UserDoc | null;
    if (!userRow) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse<null>);
      return;
    }
    res.json({
      success: true,
      data: { addresses: userRow.addresses || [] }
    } as ApiResponse<{ addresses: AddressDoc[] }>);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch addresses' } as ApiResponse<null>);
  }
});

router.post('/addresses', authenticateToken, async (req, res) => {
  const users = getUsersCollection();
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  const body = (req.body || {}) as Record<string, unknown>;
  console.log('[POST /addresses] raw body:', JSON.stringify(body, null, 2));
  const payload = typeof body.address === 'object' && body.address ? (body.address as Record<string, unknown>) : body;
  console.log('[POST /addresses] extracted payload:', JSON.stringify(payload, null, 2));
  const labelValue = resolveString(payload, ['label', 'type', 'addressType']).toUpperCase();
  const label = labelValue === 'WORK' ? 'WORK' : 'HOME';
  const name = resolveString(payload, ['name', 'fullName']);
  const phone = resolveString(payload, ['phone', 'mobile', 'phoneNumber']);
  const pincode = resolveString(payload, ['pincode', 'pinCode', 'postalCode', 'zip']);
  const locality = resolveString(payload, ['locality', 'area', 'neighborhood']);
  const addressLine = resolveString(payload, ['addressLine', 'address', 'address1', 'address_1', 'street']);
  const city = resolveString(payload, ['city', 'town', 'district']);
  const state = resolveString(payload, ['state', 'province', 'region']);
  const landmark = normalizeString(payload.landmark);
  const altPhone = resolveString(payload, ['altPhone', 'alternatePhone', 'altMobile']);

  const validatePhone = (phone: string) => {
    // Remove all non-digit characters
    let digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      digitsOnly = digitsOnly.substring(2);
    }
    // Check if it's 10 digits
    if (digitsOnly.length !== 10) return false;
    // Check if it starts with valid Indian mobile prefixes (6-9)
    const firstDigit = parseInt(digitsOnly[0]);
    return firstDigit >= 6 && firstDigit <= 9;
  };

  const validatePincode = (pincode: string) => {
    // Remove all non-digit characters
    const digitsOnly = pincode.replace(/\D/g, '');
    // Check if it's exactly 6 digits
    return digitsOnly.length === 6;
  };

  const missing: string[] = [];
  if (!name) missing.push('Name');
  if (!phone) {
    missing.push('Phone');
  } else if (!validatePhone(phone)) {
    missing.push('Phone (must be 10 digits starting with 6-9)');
  }
  if (!addressLine) missing.push('Address');
  if (!city) missing.push('City');
  if (!state) missing.push('State');
  if (!pincode) {
    missing.push('Pincode');
  } else if (!validatePincode(pincode)) {
    missing.push('Pincode (must be 6 digits)');
  }
  if (missing.length > 0) {
    res.status(400).json({
      success: false,
      error: `Missing required address fields: ${missing.join(', ')}`
    } as ApiResponse<null>);
    return;
  }

  const now = new Date();
  const address: AddressDoc = {
    id: Math.random().toString(36).substring(2, 15),
    label,
    name,
    phone,
    pincode,
    locality,
    addressLine,
    city,
    state,
    landmark,
    altPhone,
    createdAt: now,
    updatedAt: now
  };

  try {
    const userRow = (await users.findOne({ id: userId })) as UserDoc | null;
    if (!userRow) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse<null>);
      return;
    }
    const addresses = userRow.addresses ? [...userRow.addresses, address] : [address];
    await users.updateOne({ id: userId }, { $set: { addresses, updatedAt: now } });
    res.status(201).json({
      success: true,
      data: { address, addresses }
    } as ApiResponse<{ address: AddressDoc; addresses: AddressDoc[] }>);
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, error: 'Failed to add address' } as ApiResponse<null>);
  }
});

router.patch('/addresses/:id', authenticateToken, async (req, res) => {
  const users = getUsersCollection();
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  const addressId = req.params.id;
  const body = (req.body || {}) as Record<string, unknown>;
  console.log('[PATCH /addresses/:id] raw body:', JSON.stringify(body, null, 2));
  const payload = typeof body.address === 'object' && body.address ? (body.address as Record<string, unknown>) : body;
  console.log('[PATCH /addresses/:id] extracted payload:', JSON.stringify(payload, null, 2));

  try {
    const userRow = (await users.findOne({ id: userId })) as UserDoc | null;
    if (!userRow) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse<null>);
      return;
    }
    const addresses = userRow.addresses || [];
    const index = addresses.findIndex((item) => item.id === addressId);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Address not found' } as ApiResponse<null>);
      return;
    }
    const current = addresses[index];
    const labelValue = resolveString(payload, ['label', 'type', 'addressType']).toUpperCase();
    const label = labelValue ? (labelValue === 'WORK' ? 'WORK' : 'HOME') : current.label;
    const name = resolveString(payload, ['name', 'fullName']) || current.name;
    const phone = resolveString(payload, ['phone', 'mobile', 'phoneNumber']) || current.phone;
    const pincode = resolveString(payload, ['pincode', 'pinCode', 'postalCode', 'zip']) || current.pincode;
    const locality = resolveString(payload, ['locality', 'area', 'neighborhood']) || current.locality;
    const addressLine = resolveString(payload, ['addressLine', 'address', 'address1', 'address_1', 'street']) || current.addressLine;
    const city = resolveString(payload, ['city', 'town', 'district']) || current.city;
    const state = resolveString(payload, ['state', 'province', 'region']) || current.state;
    const landmark = normalizeString(payload.landmark) || current.landmark;
    const altPhone = resolveString(payload, ['altPhone', 'alternatePhone', 'altMobile']) || current.altPhone;

    const validatePhone = (phone: string) => {
      // Remove all non-digit characters
      let digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        digitsOnly = digitsOnly.substring(2);
      }
      // Check if it's 10 digits
      if (digitsOnly.length !== 10) return false;
      // Check if it starts with valid Indian mobile prefixes (6-9)
      const firstDigit = parseInt(digitsOnly[0]);
      return firstDigit >= 6 && firstDigit <= 9;
    };

    const validatePincode = (pincode: string) => {
      // Remove all non-digit characters
      const digitsOnly = pincode.replace(/\D/g, '');
      // Check if it's exactly 6 digits
      return digitsOnly.length === 6;
    };

    const missing: string[] = [];
    if (!name) missing.push('Name');
    if (!phone) {
      missing.push('Phone');
    } else if (!validatePhone(phone)) {
      missing.push('Phone (must be 10 digits starting with 6-9)');
    }
    if (!addressLine) missing.push('Address');
    if (!city) missing.push('City');
    if (!state) missing.push('State');
    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required address fields: ${missing.join(', ')}`
      } as ApiResponse<null>);
      return;
    }
    const now = new Date();
    const nextAddress: AddressDoc = {
      id: addressId,
      label,
      name,
      phone,
      pincode,
      locality,
      addressLine,
      city,
      state,
      landmark,
      altPhone,
      createdAt: current.createdAt,
      updatedAt: now
    };
    const nextAddresses = addresses.map((item, i) => (i === index ? nextAddress : item));
    await users.updateOne({ id: userId }, { $set: { addresses: nextAddresses, updatedAt: now } });
    res.json({
      success: true,
      data: { address: nextAddress, addresses: nextAddresses }
    } as ApiResponse<{ address: AddressDoc; addresses: AddressDoc[] }>);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, error: 'Failed to update address' } as ApiResponse<null>);
  }
});

router.delete('/addresses/:id', authenticateToken, async (req, res) => {
  const users = getUsersCollection();
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  const addressId = req.params.id;

  try {
    const userRow = (await users.findOne({ id: userId })) as UserDoc | null;
    if (!userRow) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse<null>);
      return;
    }
    const addresses = userRow.addresses || [];
    const nextAddresses = addresses.filter((item) => item.id !== addressId);
    if (nextAddresses.length === addresses.length) {
      res.status(404).json({ success: false, error: 'Address not found' } as ApiResponse<null>);
      return;
    }
    const now = new Date();
    await users.updateOne({ id: userId }, { $set: { addresses: nextAddresses, updatedAt: now } });
    res.json({
      success: true,
      data: { addresses: nextAddresses }
    } as ApiResponse<{ addresses: AddressDoc[] }>);
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, error: 'Failed to delete address' } as ApiResponse<null>);
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  const users = getUsersCollection();
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.userId;
  users.findOne(
    { id: userId },
    { projection: { _id: 0, id: 1, email: 1, firstName: 1, lastName: 1, role: 1, isActive: 1, createdAt: 1 } }
  )
    .then((userRow: UserDoc | null) => {
      if (!userRow) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        } as ApiResponse<null>);
        return;
      }

      res.json({
        success: true,
        data: {
          ...userRow,
          isActive: Boolean(userRow.isActive),
          createdAt: userRow.createdAt
        }
      } as ApiResponse<UserDoc & { createdAt: Date }>);
    })
    .catch((err: unknown) => {
      console.error('Error fetching user profile:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile'
      } as ApiResponse<null>);
    });
});

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required'
    } as ApiResponse<null>);
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err: Error | null, user: any) => {
    if (err) {
      console.error('[authenticateToken] JWT Verification Error:', err.message, err.name);
      res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        details: err.message
      } as ApiResponse<null>);
      return;
    }

    (req as AuthenticatedRequest).user = user as AuthTokenPayload;
    next();
  });
}

router.get('/wishlist', authenticateToken, async (req, res) => {
  const users = getUsersCollection();
  const userId = (req as AuthenticatedRequest).user.userId;

  try {
    const user = await users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: user.wishlist || []
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch wishlist' });
  }
});

router.post('/wishlist/:productId', authenticateToken, async (req, res) => {
  const users = getUsersCollection();
  const userId = (req as AuthenticatedRequest).user.userId;
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ success: false, error: 'Product ID is required' });
  }

  try {
    const user = await users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let wishlist = user.wishlist || [];
    let isAdded = false;

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter(id => id !== productId);
    } else {
      wishlist.push(productId);
      isAdded = true;
    }

    await users.updateOne(
      { id: userId },
      { $set: { wishlist, updatedAt: new Date() } }
    );

    return res.json({
      success: true,
      data: { wishlist, isAdded }
    });
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return res.status(500).json({ success: false, error: 'Failed to update wishlist' });
  }
});

export default router;
// Trigger restart
