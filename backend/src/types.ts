export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
  iat?: number;
  exp?: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type Product = {
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
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  productCount: number;
  featured: boolean;
  slug?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
