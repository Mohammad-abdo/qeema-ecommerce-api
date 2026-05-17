# Shop security checklist

- **Auth:** JWT in httpOnly `erp_access_token` cookie; storefront BFF forwards cookies; dashboards use `credentials: 'include'`.
- **Cart:** Guest session via httpOnly `erp_cart_session`; prices loaded server-side from DB only.
- **Checkout:** Customer role required; single DB transaction; stock decremented with `updateMany` guard; checkout lock in Redis.
- **Uploads:** Allowlisted image MIME types only; 5MB max per file.
- **CSRF:** SameSite=Lax cookies; mutations via same-origin BFF routes.
- **Rate limits:** Auth 10/15min; cart 60/min; checkout 10/min.
