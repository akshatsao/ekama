import express from 'express';
import type { WithId } from 'mongodb';
import { ApiResponse, Product } from '../../types';
import { getProductsCollection } from '../../utils/database';

const router = express.Router();

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
  const products = getProductsCollection();
  const {
    category,
    collection,
    collection_id,
    inStock,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    ids
  } = req.query;
  const categoryFilter = normalizeQueryString(category);
  const collectionFilter = normalizeQueryString(collection_id) || normalizeQueryString(collection);
  const searchFilter = normalizeQueryString(search);
  const minPriceFilter = normalizeQueryString(minPrice);
  const maxPriceFilter = normalizeQueryString(maxPrice);

  const filter: Record<string, unknown> = {};

  if (categoryFilter) {
    filter.category = categoryFilter;
  }

  if (collectionFilter) {
    filter.collection = collectionFilter;
  }

  if (inStock === 'true') {
    filter.inStock = true;
  } else if (inStock === 'false') {
    filter.inStock = false;
  }

  if (minPriceFilter) {
    const minValue = Number(minPriceFilter);
    if (Number.isFinite(minValue)) {
      filter.price = { ...(filter.price as Record<string, number> | undefined), $gte: minValue };
    }
  }

  if (maxPriceFilter) {
    const maxValue = Number(maxPriceFilter);
    if (Number.isFinite(maxValue)) {
      filter.price = { ...(filter.price as Record<string, number> | undefined), $lte: maxValue };
    }
  }

  if (searchFilter) {
    filter.$or = [
      { name: { $regex: searchFilter, $options: 'i' } },
      { description: { $regex: searchFilter, $options: 'i' } }
    ];
  }

  if (ids) {
    const idList = normalizeQueryString(ids)?.split(',').map(id => id.trim()).filter(Boolean);
    if (idList && idList.length > 0) {
      filter.id = { $in: idList };
    }
  }

  const validSortFields = ['name', 'price', 'rating', 'createdAt', 'updatedAt'];
  const sortField = validSortFields.includes(sortBy as string) ? String(sortBy) : 'createdAt';
  const order = sortOrder === 'ASC' ? 1 : -1;

  const limitValue = Math.max(1, Number(limit));
  const pageValue = Math.max(1, Number(page));
  const offset = (pageValue - 1) * limitValue;

  Promise.all([
    products.find(filter)
      .sort({ [sortField]: order })
      .skip(offset)
      .limit(limitValue)
      .toArray(),
    products.countDocuments(filter)
  ])
    .then(([rows, count]: [WithId<ProductDoc>[], number]) => {
      const productRows = Array.isArray(rows) ? (rows as ProductDoc[]) : [];
      const productsList: Product[] = productRows.map((row) => {
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

      res.json({
        success: true,
        data: productsList,
        pagination: {
          page: pageValue,
          limit: limitValue,
          total: count,
          totalPages: Math.ceil(count / limitValue)
        }
      } as ApiResponse<Product[]>);
    })
    .catch((err: unknown) => {
      console.error('Error fetching products:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products'
      } as ApiResponse<null>);
    });
});

router.get('/featured', (req, res) => {
  const products = getProductsCollection();
  const { limit = 6 } = req.query;
  const limitValue = Math.max(1, Number(limit));
  products.find({ inStock: true })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limitValue)
    .toArray()
    .then((rows: WithId<ProductDoc>[]) => {
      const productRows = Array.isArray(rows) ? (rows as ProductDoc[]) : [];
      const productsList: Product[] = productRows.map((row) => {
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

      res.json({
        success: true,
        data: productsList
      } as ApiResponse<Product[]>);
    })
    .catch((err: unknown) => {
      console.error('Error fetching featured products:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured products'
      } as ApiResponse<null>);
    });
});

router.get('/:id', (req, res) => {
  const products = getProductsCollection();
  const { id } = req.params;
  products.findOne({ id })
    .then((row: WithId<ProductDoc> | null) => {
      if (!row) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        } as ApiResponse<null>);
        return;
      }

      const { _id, originalPrice, ...rest } = row as ProductDoc & { _id?: unknown };
      const product: Product = {
        ...rest,
        originalPrice: originalPrice ?? undefined,
        images: Array.isArray(rest.images) ? rest.images : [],
        tags: Array.isArray(rest.tags) ? rest.tags : [],
        specifications: rest.specifications || {},
        inStock: Boolean(rest.inStock),
        createdAt: rest.createdAt,
        updatedAt: rest.updatedAt
      };

      res.json({
        success: true,
        data: product
      } as ApiResponse<Product>);
    })
    .catch((err: unknown) => {
      console.error('Error fetching product:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product'
      } as ApiResponse<null>);
    });
});

export default router;
