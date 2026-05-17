import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { SeedCatalog, SeedCommerce, SeedMerchants, SeedUsers, SeedWarehouse } from './types.ts';

export async function seedOrdersCommerce(
  prisma: PrismaClient,
  users: SeedUsers,
  merchants: SeedMerchants,
  catalog: SeedCatalog,
  _warehouse: SeedWarehouse,
): Promise<SeedCommerce> {
  const primary = catalog.catalogItems[0]!;
  const unitPrice = new Prisma.Decimal(primary.unitPrice);
  const qty = 2;
  const lineTotal = unitPrice.mul(qty);
  const shipping = new Prisma.Decimal(50);
  const orderTotal = lineTotal.add(shipping);
  const commissionAmount = lineTotal.mul(new Prisma.Decimal('0.1'));

  const address = await prisma.address.create({
    data: {
      user_id: users.customerId,
      label: 'Home',
      full_name: 'Demo Customer',
      phone: '+201000000000',
      country: 'EG',
      city: 'Cairo',
      street: 'Tahrir',
      is_default: true,
    },
  });

  const order = await prisma.order.create({
    data: {
      order_number: 'ORD-SEED-001',
      customer_id: users.customerId,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'cod',
      subtotal: lineTotal,
      shipping_amount: shipping,
      discount_amount: new Prisma.Decimal(0),
      tax_amount: new Prisma.Decimal(0),
      total_amount: orderTotal,
      currency: 'EGP',
      shipping_address_id: address.id,
      billing_address_id: address.id,
    },
  });

  const subOrder = await prisma.subOrder.create({
    data: {
      order_id: order.id,
      merchant_id: merchants.merchantId,
      status: 'processing',
      subtotal: lineTotal,
      shipping_amount: shipping,
      discount_amount: new Prisma.Decimal(0),
      tax_amount: new Prisma.Decimal(0),
      total_amount: orderTotal,
      commission_rate: new Prisma.Decimal(10),
      commission_amount: commissionAmount,
    },
  });

  const orderItem = await prisma.orderItem.create({
    data: {
      sub_order_id: subOrder.id,
      product_id: primary.productId,
      variant_id: primary.variantId,
      name_ar: primary.name_ar,
      name_en: primary.name_en,
      sku: primary.sku,
      quantity: qty,
      unit_price: unitPrice,
      total_price: lineTotal,
    },
  });

  await prisma.orderTracking.create({
    data: {
      order_id: order.id,
      sub_order_id: subOrder.id,
      status: 'picked',
      note: 'Packed at warehouse',
      location: 'Cairo Hub',
    },
  });

  await prisma.orderTrackingEvent.createMany({
    data: [
      {
        order_id: order.id,
        sub_order_id: subOrder.id,
        actor_type: 'merchant',
        actor_user_id: users.merchantUserId,
        event_code: 'order.accepted',
        title: 'Order accepted',
        visible_to_customer: true,
      },
      {
        order_id: order.id,
        sub_order_id: subOrder.id,
        actor_type: 'admin',
        actor_user_id: users.adminId,
        event_code: 'order.flagged',
        title: 'Internal review',
        visible_to_customer: false,
      },
    ],
  });

  await prisma.invoice.create({
    data: {
      order_id: order.id,
      invoice_number: 'INV-SEED-001',
      status: 'issued',
      subtotal: lineTotal,
      tax_amount: new Prisma.Decimal(0),
      total_amount: orderTotal,
      pdf_url: 'https://example.com/invoices/INV-SEED-001.pdf',
    },
  });

  await prisma.invoice.create({
    data: {
      order_id: order.id,
      invoice_number: 'INV-SEED-ARCHIVED',
      status: 'issued',
      subtotal: new Prisma.Decimal(100),
      tax_amount: new Prisma.Decimal(0),
      total_amount: new Prisma.Decimal(100),
      archived_at: new Date(),
      archived_by_user_id: users.superAdminId,
      archive_uri: 's3://erp-archive/invoices/INV-SEED-ARCHIVED.pdf',
      archive_fingerprint: 'sha256:demo',
      archive_tier: 'cold',
    },
  });

  await prisma.commission.create({
    data: {
      sub_order_id: subOrder.id,
      merchant_id: merchants.merchantId,
      rate: new Prisma.Decimal(10),
      gross_amount: orderTotal,
      amount: commissionAmount,
      status: 'pending',
    },
  });

  return {
    shippingAddressId: address.id,
    orderId: order.id,
    subOrderId: subOrder.id,
    orderItemId: orderItem.id,
  };
}
