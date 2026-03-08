import express from 'express';
import type { WithId } from 'mongodb';
import { ApiResponse, Collection, Product } from '../../types';
import { getCollectionsCollection, getProductsCollection } from '../../utils/database';

const router = express.Router();

type CollectionDoc = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  slug?: string;
  productCount: number;
  featured: boolean;
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

const normalizeQueryString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

router.get('/', (req, res) => {
  const collections = getCollectionsCollection();
  const { featured, category, page = 1, limit = 10 } = req.query;
  const categoryFilter = normalizeQueryString(category);
  const filter: Record<string, unknown> = {};
  if (featured === 'true') {
    filter.featured = true;
  }
  if (categoryFilter) {
    filter.category = categoryFilter;
  }

  const limitValue = Math.max(1, Number(limit));
  const pageValue = Math.max(1, Number(page));
  const offset = (pageValue - 1) * limitValue;

  Promise.all([
    collections.find(filter).sort({ name: 1 }).skip(offset).limit(limitValue).toArray(),
    collections.countDocuments(filter)
  ])
    .then(([rows, count]: [WithId<CollectionDoc>[], number]) => {
      const collectionRows = Array.isArray(rows) ? (rows as CollectionDoc[]) : [];
      const data = collectionRows.map((row) => {
        const { _id, ...rest } = row as CollectionDoc & { _id?: unknown };
        return {
          ...rest,
          featured: Boolean(rest.featured),
          createdAt: rest.createdAt,
          updatedAt: rest.updatedAt
        };
      });

      return res.json({
        success: true,
        data,
        pagination: {
          page: pageValue,
          limit: limitValue,
          total: count,
          totalPages: Math.ceil(count / limitValue)
        }
      } as ApiResponse<Collection[]>);
    })
    .catch((err: unknown) => {
      console.error('Error fetching collections:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch collections'
      } as ApiResponse<null>);
    });
});

router.get('/:id', (req, res) => {
  const collections = getCollectionsCollection();
  const { id } = req.params;
  const filter = { $or: [{ id }, { slug: id }] };
  collections.findOne(filter)
    .then((row: WithId<CollectionDoc> | null) => {
      if (!row) {
        return res.status(404).json({
          success: false,
          error: 'Collection not found'
        } as ApiResponse<null>);
      }

      const { _id, ...rest } = row as CollectionDoc & { _id?: unknown };
      const collection: Collection = {
        ...rest,
        featured: Boolean(rest.featured),
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt
      };

      return res.json({
        success: true,
        data: collection
      } as ApiResponse<Collection>);
    })
    .catch((err: unknown) => {
      console.error('Error fetching collection:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch collection'
      } as ApiResponse<null>);
    });
});

router.get('/:id/products', async (req, res) => {
  const products = getProductsCollection();
  const collections = getCollectionsCollection();
  const { id } = req.params;
  const { page = 1, limit = 10, inStock } = req.query;
  try {
    const collectionRow = await collections.findOne({ $or: [{ id }, { slug: id }] });
    const collectionId = collectionRow?.id || id;
    const filter: Record<string, unknown> = { collection: collectionId };
    if (inStock === 'true') {
      filter.inStock = true;
    }
    const limitValue = Math.max(1, Number(limit));
    const pageValue = Math.max(1, Number(page));
    const offset = (pageValue - 1) * limitValue;

    const rows = await products.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limitValue)
      .toArray();
    const productRows = Array.isArray(rows) ? (rows as ProductDoc[]) : [];
    const data: Product[] = productRows.map((row) => {
      const { _id, originalPrice, ...rest } = row as ProductDoc & { _id?: unknown };
      return {
        ...rest,
        originalPrice: originalPrice ?? undefined,
        images: Array.isArray(rest.images) ? rest.images : [],
        tags: Array.isArray(rest.tags) ? rest.tags : [],
        specifications: rest.specifications || {},
        inStock: Boolean(rest.inStock),
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt
      };
    });

    return res.json({
      success: true,
      data
    } as ApiResponse<Product[]>);
  } catch (err) {
    console.error('Error fetching collection products:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch collection products'
    } as ApiResponse<null>);
  }
});

export default router;
