import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import {
  assertAdminCatalogModerate,
  assertStaffCatalogList,
  createAdminProduct,
  createAdminProductImage,
  createMerchantProduct,
  createProductImage,
  createProductVariant,
  deleteMerchantProduct,
  deleteProductImage,
  deleteProductVariant,
  getMerchantProduct,
  getProductAdmin,
  getProductBySlug,
  listProducts,
  listProductsAdmin,
  listPublicCategories,
  listProductsMerchant,
  moderateProductAdmin,
  updateMerchantProduct,
  updateProductVariant,
} from './catalog.service.js';
import {
  adminProductListQuerySchema,
  createAdminProductBodySchema,
  createAdminProductImageBodySchema,
  createMerchantProductBodySchema,
  createProductImageBodySchema,
  createVariantBodySchema,
  moderateProductBodySchema,
  patchMerchantProductBodySchema,
  patchVariantBodySchema,
  productIdParamSchema,
  productImageIdParamSchema,
  merchantProductListQuerySchema,
  productListQuerySchema,
  productVariantParamsSchema,
  variantIdParamSchema,
} from './catalog.validators.js';

export async function listProductsController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = productListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listProducts(parsed.data));
}

export async function getProductBySlugController(request: FastifyRequest, reply: FastifyReply) {
  const slug = String((request.params as { slug: string }).slug ?? '');
  if (!slug) return reply.code(400).send({ message: 'Missing slug' });
  return reply.send(await getProductBySlug(slug));
}

export async function listPublicCategoriesController(_request: FastifyRequest, reply: FastifyReply) {
  const rows = await listPublicCategories();
  const data = rows.map((c) => ({
    _id: String(c.id),
    id: String(c.id),
    name: c.name_en,
    name_en: c.name_en,
    name_tr: c.name_en,
    nameAr: c.name_ar,
    slug: c.slug,
    icon: c.icon ?? undefined,
    icon_url: c.icon ?? c.image ?? undefined,
    description_en: c.description_en ?? '',
    description_tr: c.description_en ?? '',
    parentId: c.parent_id != null ? String(c.parent_id) : undefined,
  }));
  return reply.send({ success: true, data });
}

export async function listProductsAdminController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  assertStaffCatalogList(user.role);
  const parsed = adminProductListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listProductsAdmin(parsed.data));
}

export async function getProductAdminController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  assertStaffCatalogList(user.role);
  const params = productIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await getProductAdmin(params.data.id));
}

export async function createAdminProductController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  assertAdminCatalogModerate(user.role);
  const parsed = createAdminProductBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createAdminProduct(parsed.data);
  return reply.code(201).send(row);
}

export async function createAdminProductImageController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  assertAdminCatalogModerate(user.role);
  const params = productIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = createAdminProductImageBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createAdminProductImage(params.data.id, parsed.data);
  return reply.code(201).send(row);
}

export async function moderateProductAdminController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  assertAdminCatalogModerate(user.role);
  const params = productIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = moderateProductBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await moderateProductAdmin(params.data.id, parsed.data));
}

export async function getMerchantProductController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = productIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await getMerchantProduct(user.sub, params.data.id));
}

export async function listMerchantProductsController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = merchantProductListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listProductsMerchant(user.sub, parsed.data));
}

export async function createMerchantProductController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = createMerchantProductBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createMerchantProduct(user.sub, parsed.data);
  return reply.code(201).send(row);
}

export async function patchMerchantProductController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = productIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchMerchantProductBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await updateMerchantProduct(user.sub, params.data.id, parsed.data));
}

export async function deleteMerchantProductController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = productIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await deleteMerchantProduct(user.sub, params.data.id));
}

export async function createVariantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = productVariantParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = createVariantBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createProductVariant(user.sub, params.data.productId, parsed.data);
  return reply.code(201).send(row);
}

export async function patchVariantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = variantIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchVariantBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await updateProductVariant(user.sub, params.data.id, parsed.data));
}

export async function deleteVariantController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = variantIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await deleteProductVariant(user.sub, params.data.id));
}

export async function createProductImageController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = productVariantParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = createProductImageBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createProductImage(user.sub, params.data.productId, parsed.data);
  return reply.code(201).send(row);
}

export async function deleteProductImageController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = productImageIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await deleteProductImage(user.sub, params.data.id));
}
