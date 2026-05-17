# Storefront smoke checklist

Prerequisites: MySQL + Redis running, `npm run prisma:migrate` and `npm run prisma:seed` in `backend/`, env set per `.env.example`.

1. **Health** — `GET http://localhost:3001/health` → 200  
2. **Ready** — `GET http://localhost:3001/health/ready` → 200 (db + redis)  
3. **Home** — `GET http://localhost:3001/api/v1/storefront/home` → stories, categories, products  
4. **Products** — `GET http://localhost:3001/api/v1/products?limit=5`  
5. **PDP** — `GET http://localhost:3001/api/v1/products/seed-electronics-p0`  
6. **Categories** — `GET http://localhost:3001/api/v1/categories`  
7. **Cart (guest)** — `POST /api/v1/cart/items` with `variant_id`, cookie `erp_cart_session` set  
8. **Login** — `POST /api/v1/auth/login` (`customer@erp.local` / `Password123!`)  
9. **Checkout** — `POST /api/v1/orders/checkout` with `address_id`, `payment_method: cod`  
10. **Orders** — `GET /api/v1/orders` with auth cookie  

Frontend (set `NEXT_PUBLIC_ERP_API_URL=http://localhost:3001`):

- `/en` home loads ERP data  
- `/en/products` listing  
- `/en/listing/seed-electronics-p0` PDP  
- Add to cart → `/en/cart` → checkout COD → `/en/account/orders`

**Merchant fulfillment (COD):**

1. Login as `merchant@erp.local` / `Password123!`
2. Open `/en/merchant/orders` → view a customer order
3. **Confirm** → **Mark shipped** (enter tracking #) → **Mark delivered (COD collected)**
4. Customer sees tracking on `/en/account/orders/:id`

**Admin overview:** `/en/admin/orders` — stats, search, commission status.

**Background worker (emails + commission):**
```bash
cd backend && npm run worker
```

**Dev tips:** Set `COMMISSION_CLEAR_DELAY_MS=60000` and run worker to test commission wallet credit within 1 minute of delivery.
