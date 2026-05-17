import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import { productImageFor } from './seed-media.ts';
import type { CatalogSeedItem, SeedCatalog, SeedMerchants, SeedUsers } from './types.ts';

const CATEGORY_DEFS = [
  { slug: 'electronics', name_en: 'Electronics', name_ar: 'إلكترونيات' },
  { slug: 'fashion', name_en: 'Fashion', name_ar: 'أزياء' },
  { slug: 'home-kitchen', name_en: 'Home & Kitchen', name_ar: 'منزل ومطبخ' },
  { slug: 'beauty', name_en: 'Beauty', name_ar: 'جمال' },
  { slug: 'sports', name_en: 'Sports', name_ar: 'رياضة' },
  { slug: 'books', name_en: 'Books', name_ar: 'كتب' },
  { slug: 'toys', name_en: 'Toys', name_ar: 'ألعاب' },
  { slug: 'groceries', name_en: 'Groceries', name_ar: 'بقالة' },
] as const;

const BRAND_DEFS = [
  { name: 'DemoBrand', slug: 'demo-brand' },
  { name: 'SeedLine', slug: 'seed-line' },
] as const;

/** 5 product name pairs per category (index = product slot in category) */
const PRODUCT_NAMES: { name_en: string; name_ar: string }[][] = [
  [
    { name_en: 'Wireless Headphones', name_ar: 'سماعات لاسلكية' },
    { name_en: 'USB-C Hub 7-in-1', name_ar: 'موزع USB-C' },
    { name_en: 'Mechanical Keyboard', name_ar: 'لوحة مفاتيح ميكانيكية' },
    { name_en: '27" IPS Monitor', name_ar: 'شاشة 27 بوصة' },
    { name_en: 'Portable SSD 1TB', name_ar: 'SSD محمول 1 تيرا' },
  ],
  [
    { name_en: 'Cotton T-Shirt', name_ar: 'تيشيرت قطني' },
    { name_en: 'Slim Fit Jeans', name_ar: 'جينز ضيق' },
    { name_en: 'Running Sneakers', name_ar: 'حذاء جري' },
    { name_en: 'Wool Scarf', name_ar: 'وشاح صوف' },
    { name_en: 'Leather Belt', name_ar: 'حزام جلد' },
  ],
  [
    { name_en: 'Stainless Cookware Set', name_ar: 'طقم أواني ستانلس' },
    { name_en: 'Glass Food Containers', name_ar: 'حافظات طعام زجاجية' },
    { name_en: 'Coffee Maker', name_ar: 'آلة قهوة' },
    { name_en: 'LED Desk Lamp', name_ar: 'مصباح مكتب LED' },
    { name_en: 'Non-Stick Pan 28cm', name_ar: 'مقلاة غير لاصقة' },
  ],
  [
    { name_en: 'Face Moisturizer', name_ar: 'مرطب للوجه' },
    { name_en: 'Vitamin C Serum', name_ar: 'سيروم فيتامين سي' },
    { name_en: 'Shampoo 400ml', name_ar: 'شامبو' },
    { name_en: 'Sunscreen SPF50', name_ar: 'واقي شمس' },
    { name_en: 'Lip Balm Set', name_ar: 'مجموعة مرطب شفاه' },
  ],
  [
    { name_en: 'Yoga Mat', name_ar: 'سجادة يوغا' },
    { name_en: 'Dumbbells 2x5kg', name_ar: 'دمبلز' },
    { name_en: 'Water Bottle 750ml', name_ar: 'زجاجة ماء' },
    { name_en: 'Resistance Bands', name_ar: 'أربطة مقاومة' },
    { name_en: 'Jump Rope', name_ar: 'حبل قفز' },
  ],
  [
    { name_en: 'Arabic Fiction Novel', name_ar: 'رواية عربية' },
    { name_en: 'Self-Help Guide', name_ar: 'كتيب تطوير ذات' },
    { name_en: 'Children Storybook', name_ar: 'قصص أطفال' },
    { name_en: 'Cookbook Mediterranean', name_ar: 'كتاب طبخ' },
    { name_en: 'Tech Reference Manual', name_ar: 'دليل تقني' },
  ],
  [
    { name_en: 'Building Blocks 100pc', name_ar: 'مكعبات بناء' },
    { name_en: 'Remote Control Car', name_ar: 'سيارة ريموت' },
    { name_en: 'Board Game Family', name_ar: 'لعبة جماعية' },
    { name_en: 'Plush Teddy Bear', name_ar: 'دبدوب' },
    { name_en: 'Puzzle 500 pieces', name_ar: 'أحجية 500 قطعة' },
  ],
  [
    { name_en: 'Basmati Rice 5kg', name_ar: 'أرز بسمتي' },
    { name_en: 'Olive Oil 1L', name_ar: 'زيت زيتون' },
    { name_en: 'Whole Bean Coffee 500g', name_ar: 'قهوة حبوب' },
    { name_en: 'Honey Jar 500g', name_ar: 'عسل' },
    { name_en: 'Mixed Nuts 400g', name_ar: 'مكسرات' },
  ],
];

export async function seedCatalog(
  prisma: PrismaClient,
  merchants: SeedMerchants,
  users: SeedUsers,
): Promise<SeedCatalog> {
  const categories = await Promise.all(
    CATEGORY_DEFS.map((c) =>
      prisma.category.create({
        data: {
          name_ar: c.name_ar,
          name_en: c.name_en,
          slug: c.slug,
          is_active: true,
        },
      }),
    ),
  );

  const brands = await Promise.all(
    BRAND_DEFS.map((b) =>
      prisma.brand.create({
        data: {
          name: b.name,
          slug: b.slug,
          is_active: true,
        },
      }),
    ),
  );

  const attr = await prisma.attribute.create({
    data: {
      name: 'Color',
      type: 'color',
      is_global: true,
    },
  });

  const colorValues = await Promise.all(
    [
      { value: 'Black', color_code: '#111111' },
      { value: 'White', color_code: '#EEEEEE' },
      { value: 'Navy', color_code: '#001F3F' },
    ].map((cv) =>
      prisma.attributeValue.create({
        data: {
          attribute_id: attr.id,
          value: cv.value,
          color_code: cv.color_code,
        },
      }),
    ),
  );

  const catalogItems: CatalogSeedItem[] = [];

  for (let mi = 0; mi < merchants.merchants.length; mi++) {
    const merchant = merchants.merchants[mi]!;
    const ci = merchant.categoryIndex;
    const category = categories[ci]!;
    const names = PRODUCT_NAMES[ci]!;

    for (let pi = 0; pi < names.length; pi++) {
      const { name_en, name_ar } = names[pi]!;
      const slug = `${merchant.store_slug}-${category.slug}-p${pi}`;
      const sku = `SEED-${merchant.store_slug.slice(0, 8).toUpperCase()}-${String(pi).padStart(2, '0')}`;
      const brand = brands[pi % brands.length]!;
      const imageUrl = productImageFor(category.slug, pi);
      const price =
        mi === 0 && pi === 0
          ? new Prisma.Decimal('799.99')
          : new Prisma.Decimal(49 + ci * 17 + pi * 13 + mi * 3 + 0.99);

      const product = await prisma.product.create({
        data: {
          merchant_id: merchant.id,
          category_id: category.id,
          brand_id: brand.id,
          name_ar,
          name_en,
          slug,
          description_ar: `منتج من ${merchant.store_name} — ${name_ar}`,
          description_en: `${merchant.store_name} — ${name_en}`,
          product_type: 'simple',
          status: 'published',
          is_approved: true,
          is_featured: pi === 0 && mi < 6,
          approved_by: users.adminId,
          published_at: new Date(),
          view_count: 40 + mi * 11 + pi * 7,
        },
      });

      const variant = await prisma.productVariant.create({
        data: {
          product_id: product.id,
          sku,
          price,
          compare_at_price: price.mul(new Prisma.Decimal('1.12')),
          stock_quantity: 40 + mi * 4 + pi * 5,
          is_active: true,
        },
      });

      await prisma.productImage.create({
        data: {
          product_id: product.id,
          image_url: imageUrl,
          is_primary: true,
        },
      });

      if (pi % 2 === 0) {
        await prisma.productImage.create({
          data: {
            product_id: product.id,
            image_url: productImageFor(category.slug, pi + 1),
            is_primary: false,
          },
        });
      }

      await prisma.productAttribute.create({
        data: {
          product_id: product.id,
          attribute_id: attr.id,
        },
      });

      await prisma.variantAttributeValue.create({
        data: {
          variant_id: variant.id,
          attribute_id: attr.id,
          attribute_value_id: colorValues[(ci + pi) % colorValues.length]!.id,
        },
      });

      catalogItems.push({
        productId: product.id,
        variantId: variant.id,
        merchantId: merchant.id,
        slug,
        sku,
        name_en,
        name_ar,
        categoryId: category.id,
        imageUrl,
        unitPrice: price.toFixed(2),
      });
    }
  }

  const primary = catalogItems[0]!;
  if (!primary) throw new Error('Catalog seed produced no products');

  for (let i = 1; i < Math.min(6, catalogItems.length); i++) {
    await prisma.productRelation.create({
      data: {
        product_id: primary.productId,
        related_product_id: catalogItems[i]!.productId,
        relation_type: 'related',
        sort_order: i,
      },
    });
  }

  return {
    productId: primary.productId,
    variantId: primary.variantId,
    categoryId: primary.categoryId,
    brandId: brands[0]!.id,
    categoryIds: categories.map((c) => c.id),
    brandIds: brands.map((b) => b.id),
    catalogItems,
  };
}
