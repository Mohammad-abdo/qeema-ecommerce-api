export type CartLineItem = {
  variantId: number;
  productId: number;
  merchantId: number;
  quantity: number;
  price: string;
  compare_price: string | null;
  product_name_ar: string;
  product_name_en: string;
  product_slug?: string;
  variant_label: string;
  image_url: string;
  sku: string;
};

export type RedisCartPayload = {
  items: CartLineItem[];
  updatedAt: string;
};

export type CartContext = {
  redisKey: string;
  cartId: string;
  isGuest: boolean;
  userId?: number;
  sessionId?: string;
};
