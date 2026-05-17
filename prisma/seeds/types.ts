export type SeedUsers = {
  superAdminId: number;
  adminId: number;
  employeeUserId: number;
  merchantUserId: number;
  customerId: number;
};

export type SeedFoundations = {
  localeEnId: number;
  localeArId: number;
};

export type SeedMerchantRow = {
  id: number;
  store_name: string;
  store_slug: string;
  store_name_ar: string;
  categoryIndex: number;
};

export type SeedMerchants = {
  merchantId: number;
  merchants: SeedMerchantRow[];
};

/** Every seeded product+variant (for SearchIndex, warehouse stock, etc.) */
export type CatalogSeedItem = {
  productId: number;
  variantId: number;
  merchantId: number;
  slug: string;
  sku: string;
  name_en: string;
  name_ar: string;
  categoryId: number;
  imageUrl: string;
  /** Unit price as decimal string (matches DB) */
  unitPrice: string;
};

export type SeedCatalog = {
  /** Primary demo product (orders, cart, flash sale, etc.) */
  productId: number;
  variantId: number;
  categoryId: number;
  brandId: number;
  categoryIds: number[];
  brandIds: number[];
  catalogItems: CatalogSeedItem[];
};

export type SeedWarehouse = { warehouseId: number };

export type SeedCommerce = {
  shippingAddressId: number;
  orderId: number;
  subOrderId: number;
  orderItemId: number;
};
