import bcrypt from 'bcryptjs';
import { Collection, Db, MongoClient } from 'mongodb';

type CollectionDoc = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  productCount: number;
  featured: boolean;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProductDoc = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  category: string;
  collection: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  specifications?: Record<string, string>;
  siddhAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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

type CouponDoc = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minCartValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type OrderDoc = {
  id: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  name?: string;
  items?: unknown[];
  totalAmount: number;
  status: string;
  shippingAddress?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CategoryDoc = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type TableDoc = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StoreSettingsDoc = {
  id: string; // e.g., 'home_page_layout'
  heroTitle: string;
  heroVisible: boolean;
  trendingTitle: string;
  trendingVisible: boolean;
  newArrivalsTitle: string;
  newArrivalsVisible: boolean;
  collectionsTitle: string;
  collectionsVisible: boolean;
  reviewsTitle: string;
  reviewsVisible: boolean;
  featuresTitle: string;
  featuresVisible: boolean;
  heroCollectionIds: string[];
  trendingProductIds: string[];
  newArrivalsProductIds: string[];
  promoBannerTitle: string;
  promoBannerImages: string[];
  promoBannerVisible: boolean;
  videoPromoTitle: string;
  videoPromoVisible: boolean;
  videoPromoUrls: string[];
  createdAt: Date;
  updatedAt: Date;
};


let client: MongoClient | null = null;
let db: Db | null = null;

const isTlsError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('ERR_SSL') || message.includes('tlsv1') || message.includes('TLS');
};

export const initDatabase = async (): Promise<void> => {
  const allowInvalidTls = process.env.MONGODB_TLS_ALLOW_INVALID === 'true';
  const buildOptions = (targetUri: string, forceAllowInvalidTls = false) => {
    const usesSrv = targetUri.startsWith('mongodb+srv://');
    const skipTlsCheck = allowInvalidTls || forceAllowInvalidTls;
    return {
      serverSelectionTimeoutMS: 10000,
      tls: usesSrv ? true : undefined,
      tlsAllowInvalidCertificates: skipTlsCheck ? true : undefined,
      tlsAllowInvalidHostnames: skipTlsCheck ? true : undefined,
    };
  };
  const connectWithOptions = async (targetUri: string) => {
    const baseOptions = buildOptions(targetUri);
    client = new MongoClient(targetUri, baseOptions);
    try {
      await client.connect();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production' && isTlsError(error)) {
        // Retry with TLS checks disabled (dev environment / self-signed certs)
        client = new MongoClient(targetUri, buildOptions(targetUri, true));
        await client.connect();
      } else {
        throw error;
      }
    }
  };
  const uri = process.env.MONGODB_URI || process.env.MONG_URL || 'mongodb://127.0.0.1:27017';
  const fallbackUri = process.env.MONGODB_FALLBACK_URI;
  try {
    await connectWithOptions(uri);
  } catch (error) {
    if (fallbackUri) {
      await connectWithOptions(fallbackUri);
    } else {
      throw error;
    }
  }
  const dbName = process.env.MONGODB_DB || process.env.MONG_DATABASE;
  if (!client) {
    throw new Error('Database client not initialized');
  }
  db = dbName ? client.db(dbName) : client.db();
  await ensureIndexes();
  await seedData();
};

const getDb = (): Db => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export const getCollectionsCollection = (): Collection<CollectionDoc> => getDb().collection<CollectionDoc>('collections');
export const getProductsCollection = (): Collection<ProductDoc> => getDb().collection<ProductDoc>('products');
export const getUsersCollection = (): Collection<UserDoc> => getDb().collection<UserDoc>('users');
export const getOrdersCollection = (): Collection<OrderDoc> => getDb().collection<OrderDoc>('orders');
export const getCategoriesCollection = (): Collection<CategoryDoc> => getDb().collection<CategoryDoc>('categories');
export const getTablesCollection = (): Collection<TableDoc> => getDb().collection<TableDoc>('tables');
export const getStoreSettingsCollection = (): Collection<StoreSettingsDoc> => getDb().collection<StoreSettingsDoc>('store_settings');

const ensureIndexes = async (): Promise<void> => {
  const collections = getCollectionsCollection();
  const products = getProductsCollection();
  const users = getUsersCollection();
  const orders = getOrdersCollection();
  const categories = getCategoriesCollection();
  const tables = getTablesCollection();

  await Promise.all([
    collections.createIndex({ id: 1 }, { unique: true }),
    collections.createIndex({ slug: 1 }),
    products.createIndex({ id: 1 }, { unique: true }),
    products.createIndex({ collection: 1 }),
    users.createIndex({ id: 1 }, { unique: true }),
    users.createIndex({ email: 1 }, { unique: true }),
    orders.createIndex({ id: 1 }, { unique: true }),
    orders.createIndex({ userId: 1 }),
    categories.createIndex({ id: 1 }, { unique: true }),
    categories.createIndex({ name: 1 }),
    tables.createIndex({ id: 1 }, { unique: true }),
    tables.createIndex({ name: 1 }),
    getStoreSettingsCollection().createIndex({ id: 1 }, { unique: true })
  ]);
};

const seedData = async (): Promise<void> => {
  await setDefaultSlugs();
  await ensureAdminUser();
  await insertSampleData();
  await insertSampleProducts();
  await syncCollectionCounts();
  await ensureCategories();
  await ensureStoreSettings();
  await ensureCoupons();
};

const ensureStoreSettings = async (): Promise<void> => {
  const settings = getStoreSettingsCollection();
  const now = new Date();

  const defaultLayout: StoreSettingsDoc = {
    id: 'home_page_layout',
    heroTitle: 'Hero Section',
    heroVisible: true,
    trendingTitle: 'Trending Now',
    trendingVisible: true,
    newArrivalsTitle: 'New Arrivals',
    newArrivalsVisible: true,
    collectionsTitle: 'Shop Our Collections',
    collectionsVisible: true,
    reviewsTitle: 'Customer Reviews',
    reviewsVisible: true,
    featuresTitle: 'Why Choose Us',
    featuresVisible: true,
    heroCollectionIds: [],
    trendingProductIds: [],
    newArrivalsProductIds: [],
    promoBannerTitle: 'Promotional Banner',
    promoBannerImages: ['/images/banner.jpg'],
    promoBannerVisible: true,
    videoPromoTitle: 'Experience the Divine',
    videoPromoVisible: true,
    videoPromoUrls: [],
    createdAt: now,
    updatedAt: now
  };

  await settings.updateOne(
    { id: 'home_page_layout' },
    { $setOnInsert: defaultLayout },
    { upsert: true }
  );
};

export const getCouponsCollection = (): Collection<CouponDoc> => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.collection<CouponDoc>('coupons');
};

const ensureCoupons = async (): Promise<void> => {
  const coupons = getCouponsCollection();
  const now = new Date();

  const defaultCoupons: CouponDoc[] = [
    {
      id: 'namaste-10-percent',
      code: 'NAMASTE',
      discountType: 'percentage',
      discountValue: 10,
      minCartValue: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'namaste-100-flat',
      code: 'NAMASTE100',
      discountType: 'fixed',
      discountValue: 100,
      minCartValue: 999,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const coupon of defaultCoupons) {
    await coupons.updateOne(
      { code: coupon.code },
      { $setOnInsert: coupon },
      { upsert: true }
    );
  }
};

const ensureAdminUser = async (): Promise<void> => {
  const adminEmails = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!adminEmails || !password) {
    return;
  }
  const users = getUsersCollection();
  const now = new Date();
  const hashedPassword = await bcrypt.hash(password, 10);
  const emails = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  for (const email of emails) {
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUser = await users.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } });
    if (existingUser) {
      await users.updateOne(
        { email: existingUser.email },
        { $set: { email, password: hashedPassword, role: 'admin', isActive: true, updatedAt: now } }
      );
    } else {
      const userDoc: UserDoc = {
        id: Math.random().toString(36).substring(2, 15),
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: '',
        role: 'admin',
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      await users.insertOne(userDoc);
    }
  }
};

const setDefaultSlugs = async (): Promise<void> => {
  const collections = getCollectionsCollection();
  await collections.updateMany(
    { $or: [{ slug: { $exists: false } }, { slug: '' }] },
    [{ $set: { slug: '$id' } }]
  );
};

const insertSampleData = async (): Promise<void> => {
  const collections = getCollectionsCollection();
  const count = await collections.countDocuments();
  const now = new Date();
  const docs: CollectionDoc[] = [
    { id: 'rudraksha-bracelets', name: 'Rudraksha Bracelets', description: 'Authentic rudraksha bracelets for spiritual wellness', image: '/images/Rudraksha_Bracelets/Rudraksha_Bracelets1.jpg', category: 'Bracelets', productCount: 5, featured: true, slug: 'rudraksha-bracelets', createdAt: now, updatedAt: now },
    { id: 'rudraksha-malas', name: 'Rudraksha Malas', description: 'Sacred rudraksha prayer beads for meditation', image: '/images/Rudraksha Malas/Rudraksha Malas1.jpeg', category: 'Malas', productCount: 3, featured: true, slug: 'rudraksha-malas', createdAt: now, updatedAt: now },
    { id: 'energy-stones', name: 'Energy Stones', description: 'Powerful healing crystals and energy stones', image: '/images/Energy Stones/Energy Stones1.jpeg', category: 'Crystals', productCount: 8, featured: false, slug: 'energy-stones', createdAt: now, updatedAt: now },
    { id: 'spiritual-jewellery', name: 'Spiritual Jewellery', description: 'Sacred jewellery for spiritual connection', image: '/images/Spiritual Jewellery/Spiritual Jewellery2.jpg', category: 'Jewellery', productCount: 6, featured: true, slug: 'spiritual-jewellery', createdAt: now, updatedAt: now },
    { id: 'karungali-wearables', name: 'Karungali Wearables', description: 'Traditional karungali wood accessories', image: '/images/Karungali Wearables/Karungali Wearables2.jpg', category: 'Accessories', productCount: 4, featured: false, slug: 'karungali-wearables', createdAt: now, updatedAt: now },
    { id: 'rashi-wearables', name: 'Rashi Wearables', description: 'Astrological wearables based on your rashi', image: '/images/Rashi Wearables/Rashi Wearables1.jpg', category: 'Astrology', productCount: 7, featured: false, slug: 'rashi-wearables', createdAt: now, updatedAt: now },
    { id: 'nepali-rudraksha', name: 'Nepali/Indian Rudraksha', description: 'Authentic rudraksha from Nepal and India', image: '/images/NepaliIndian Rudraksha/Rudraksha1.jpg', category: 'Rudraksha', productCount: 9, featured: true, slug: 'nepali-rudraksha', createdAt: now, updatedAt: now },
    { id: 'gift-hampers', name: 'Gift Hampers', description: 'Thoughtfully curated spiritual gift sets', image: '/images/Gift Hampers/Gift Hampers1.jpeg', category: 'Gifts', productCount: 3, featured: false, slug: 'gift-hampers', createdAt: now, updatedAt: now }
  ];
  if (count === 0) {
    await collections.insertMany(docs);
    return;
  }
  await Promise.all(
    docs.map((doc) =>
      collections.updateOne({ id: doc.id }, { $setOnInsert: doc }, { upsert: true })
    )
  );
};

const insertSampleProducts = async (): Promise<void> => {
  const products = getProductsCollection();
  const count = await products.countDocuments();
  if (count > 0) {
    return;
  }
  const now = new Date();
  const docs: ProductDoc[] = [
    {
      id: 'rudraksha-bracelet-sample-1',
      name: 'Sacred Rudraksha Bracelet',
      description: 'Sacred beads for spiritual protection',
      price: 19.99,
      originalPrice: 24.99,
      images: ['/images/Rudraksha_Bracelets/Rudraksha_Bracelets1.jpg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 25,
      rating: 4.8,
      reviewCount: 32,
      tags: ['rudraksha', 'spiritual', 'bracelet'],
      specifications: { material: 'Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'gold-plated-rudraksha',
      name: 'Gold Plated Rudraksha Bracelet',
      description: 'Elegant gold plated bracelet with Rudraksha beads',
      price: 799,
      images: ['/images/Rudraksha_Bracelets/gold-plated-rudraksha-bracelet.svg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 50,
      rating: 4.5,
      reviewCount: 45,
      tags: ['gold', 'rudraksha', 'bracelet'],
      specifications: { material: 'Gold Plated Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'silver-plated-rudraksha',
      name: 'Silver Plated Rudraksha Bracelet',
      description: 'Stylish silver plated bracelet with sacred beads',
      price: 799,
      images: ['/images/Rudraksha_Bracelets/silver-plated-rudraksha-bracelet.svg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 40,
      rating: 4.6,
      reviewCount: 38,
      tags: ['silver', 'rudraksha', 'bracelet'],
      specifications: { material: 'Silver Plated Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'chain-rudraksha',
      name: 'Chain Rudraksha Bracelet',
      description: 'Chain style bracelet with Rudraksha',
      price: 799,
      images: ['/images/Rudraksha_Bracelets/chain-rudraksha-bracelet.svg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 30,
      rating: 4.4,
      reviewCount: 25,
      tags: ['chain', 'rudraksha', 'bracelet'],
      specifications: { material: 'Chain Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'beaded-rudraksha',
      name: 'Beaded Rudraksha Bracelet',
      description: 'Traditional beaded Rudraksha bracelet',
      price: 799,
      images: ['/images/Rudraksha_Bracelets/beaded-rudraksha-bracelet.svg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 60,
      rating: 4.7,
      reviewCount: 50,
      tags: ['beaded', 'rudraksha', 'bracelet'],
      specifications: { material: 'Beaded Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'norwegian-ebony-rudraksha',
      name: 'Norwegian Rudraksha Ebony Bracelet',
      description: 'Unique Norwegian style with ebony and Rudraksha',
      price: 799,
      images: ['/images/Rudraksha_Bracelets/norwegian-rudraksha-ebony-bracelet.svg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 20,
      rating: 4.3,
      reviewCount: 15,
      tags: ['norwegian', 'ebony', 'rudraksha'],
      specifications: { material: 'Ebony Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'gold-chain-rudraksha',
      name: 'Gold Chain Rudraksha Bracelet',
      description: 'Gold chain with Rudraksha accents',
      price: 799,
      images: ['/images/Rudraksha_Bracelets/gold-chain-rudraksha-bracelet.svg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 35,
      rating: 4.5,
      reviewCount: 40,
      tags: ['gold chain', 'rudraksha', 'bracelet'],
      specifications: { material: 'Gold Chain Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'organic-magnet-rudraksha',
      name: 'Organic Magnet Rudraksha Bracelet',
      description: 'Organic bracelet with magnetic Rudraksha beads',
      price: 799,
      images: ['/images/Rudraksha_Bracelets/organic-magnet-rudraksha-bracelet.svg'],
      category: 'Bracelets',
      collection: 'rudraksha-bracelets',
      inStock: true,
      stockQuantity: 45,
      rating: 4.6,
      reviewCount: 28,
      tags: ['organic', 'magnet', 'rudraksha'],
      specifications: { material: 'Organic Magnet Rudraksha', size: 'Adjustable' },
      createdAt: now,
      updatedAt: now
    }
  ];
  await products.insertMany(docs);
};

const syncCollectionCounts = async (): Promise<void> => {
  const collections = getCollectionsCollection();
  const products = getProductsCollection();
  const totals = await products.aggregate<{ _id: string; total: number }>([
    { $group: { _id: '$collection', total: { $sum: 1 } } }
  ]).toArray();
  const now = new Date();
  await Promise.all(totals.map((t: { _id: string; total: number }) => (
    collections.updateOne({ id: t._id }, { $set: { productCount: t.total, updatedAt: now } })
  )));
};

const ensureCategories = async (): Promise<void> => {
  const collections = getCollectionsCollection();
  const products = getProductsCollection();
  const categories = getCategoriesCollection();
  const now = new Date();

  const [collectionCategories, productCategories] = await Promise.all([
    collections.distinct('category'),
    products.distinct('category')
  ]);

  const names = [...new Set(
    [...collectionCategories, ...productCategories]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean)
  )];

  if (names.length === 0) {
    return;
  }

  await Promise.all(
    names.map((name) => {
      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return categories.updateOne(
        { id },
        { $set: { name, updatedAt: now }, $setOnInsert: { id, createdAt: now } },
        { upsert: true }
      );
    })
  );
};
