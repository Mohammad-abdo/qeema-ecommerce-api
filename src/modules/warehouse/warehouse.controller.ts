import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../../lib/errors.js';

import {
  createWarehouse,
  createWarehouseStock,
  deleteWarehouse,
  deleteWarehouseStock,
  listWarehousesForUser,
  updateWarehouse,
  updateWarehouseStock,
} from './warehouse.service.js';
import {
  createWarehouseBodySchema,
  createWarehouseStockBodySchema,
  patchWarehouseBodySchema,
  patchWarehouseStockBodySchema,
  warehouseIdParamSchema,
  warehouseListQuerySchema,
  warehouseStockIdParamSchema,
} from './warehouse.validators.js';

export async function listWarehousesController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = warehouseListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await listWarehousesForUser(user.sub, user.role, parsed.data));
}

export async function createWarehouseController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const parsed = createWarehouseBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createWarehouse(user.sub, parsed.data);
  return reply.code(201).send(row);
}

export async function patchWarehouseController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = warehouseIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchWarehouseBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await updateWarehouse(user.sub, params.data.id, parsed.data));
}

export async function deleteWarehouseController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = warehouseIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await deleteWarehouse(user.sub, params.data.id));
}

export async function createWarehouseStockController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = warehouseIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = createWarehouseStockBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  const row = await createWarehouseStock(user.sub, params.data.id, parsed.data);
  return reply.code(201).send(row);
}

export async function patchWarehouseStockController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = warehouseStockIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  const parsed = patchWarehouseStockBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return reply.send(await updateWarehouseStock(user.sub, params.data.stockId, parsed.data));
}

export async function deleteWarehouseStockController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  const params = warehouseStockIdParamSchema.safeParse(request.params);
  if (!params.success) {
    return reply.code(400).send({ message: 'Validation failed', errors: params.error.flatten() });
  }
  return reply.send(await deleteWarehouseStock(user.sub, params.data.stockId));
}
