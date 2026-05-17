import type { FastifyInstance } from 'fastify';

import { requireRoles } from '../../plugins/roles.js';

import {
  createWarehouseController,
  createWarehouseStockController,
  deleteWarehouseController,
  deleteWarehouseStockController,
  listWarehousesController,
  patchWarehouseController,
  patchWarehouseStockController,
} from './warehouse.controller.js';

export async function warehouseRoutes(app: FastifyInstance) {
  app.get('/api/v1/warehouses', {
    preHandler: [app.authenticate, requireRoles('merchant', 'admin', 'super_admin', 'employee')],
    schema: { tags: ['Warehouse'] },
  }, listWarehousesController);

  app.post('/api/v1/warehouses', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Warehouse'] },
  }, createWarehouseController);

  app.patch('/api/v1/warehouses/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Warehouse'] },
  }, patchWarehouseController);

  app.delete('/api/v1/warehouses/:id', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Warehouse'] },
  }, deleteWarehouseController);

  app.post('/api/v1/warehouses/:id/stocks', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Warehouse'] },
  }, createWarehouseStockController);

  app.patch('/api/v1/warehouse-stocks/:stockId', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Warehouse'] },
  }, patchWarehouseStockController);

  app.delete('/api/v1/warehouse-stocks/:stockId', {
    preHandler: [app.authenticate, requireRoles('merchant')],
    schema: { tags: ['Warehouse'] },
  }, deleteWarehouseStockController);
}
