-- Merchant storefront: policies, contact, social
ALTER TABLE `MerchantSettings`
  ADD COLUMN `privacy_policy` TEXT NULL,
  ADD COLUMN `terms_policy` TEXT NULL,
  ADD COLUMN `contact_phone` VARCHAR(32) NULL,
  ADD COLUMN `contact_whatsapp` VARCHAR(32) NULL,
  ADD COLUMN `contact_email` VARCHAR(255) NULL,
  ADD COLUMN `contact_address` TEXT NULL,
  ADD COLUMN `social_links` JSON NULL;
