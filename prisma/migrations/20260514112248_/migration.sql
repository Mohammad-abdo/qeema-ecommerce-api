-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `device_info` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_token_key`(`token`),
    INDEX `Session_user_id_idx`(`user_id`),
    INDEX `Session_expires_at_idx`(`expires_at`),
    INDEX `Session_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AuditLog_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `AuditLog_module_action_idx`(`module`, `action`),
    INDEX `AuditLog_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeePermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeePermission_employee_id_permission_id_key`(`employee_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureFlag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `conditions` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FeatureFlag_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Locale` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `native_name` VARCHAR(191) NOT NULL,
    `direction` ENUM('ltr', 'rtl') NOT NULL DEFAULT 'ltr',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `inherit_from_id` INTEGER NULL,
    `number_system` VARCHAR(16) NULL,
    `calendar` VARCHAR(32) NULL,
    `collator_strength` INTEGER NULL,
    `plural_rules` JSON NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Locale_code_key`(`code`),
    INDEX `Locale_is_active_idx`(`is_active`),
    INDEX `Locale_is_default_idx`(`is_default`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocaleFallback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `locale_id` INTEGER NOT NULL,
    `fallback_locale_id` INTEGER NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `LocaleFallback_locale_id_priority_idx`(`locale_id`, `priority`),
    UNIQUE INDEX `LocaleFallback_locale_id_fallback_locale_id_key`(`locale_id`, `fallback_locale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationNamespace` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NULL,
    `slug` VARCHAR(128) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `TranslationNamespace_merchant_id_idx`(`merchant_id`),
    UNIQUE INDEX `TranslationNamespace_merchant_id_slug_key`(`merchant_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namespace_id` INTEGER NOT NULL,
    `key` VARCHAR(512) NOT NULL,
    `description` TEXT NULL,
    `context` VARCHAR(255) NULL,
    `entity_type` VARCHAR(128) NULL,
    `entity_id` VARCHAR(64) NULL,
    `field_path` VARCHAR(255) NULL,
    `default_value` TEXT NULL,
    `is_plural` BOOLEAN NOT NULL DEFAULT false,
    `icu_message` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `TranslationKey_namespace_id_entity_type_entity_id_idx`(`namespace_id`, `entity_type`, `entity_id`),
    INDEX `TranslationKey_entity_type_entity_id_field_path_idx`(`entity_type`, `entity_id`, `field_path`),
    UNIQUE INDEX `TranslationKey_namespace_id_key_key`(`namespace_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Translation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `translation_key_id` INTEGER NOT NULL,
    `locale_id` INTEGER NOT NULL,
    `value` LONGTEXT NOT NULL,
    `status` ENUM('draft', 'in_review', 'published', 'archived') NOT NULL DEFAULT 'published',
    `version` INTEGER NOT NULL DEFAULT 1,
    `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `published_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Translation_locale_id_status_idx`(`locale_id`, `status`),
    INDEX `Translation_translation_key_id_idx`(`translation_key_id`),
    INDEX `Translation_updated_at_idx`(`updated_at`),
    UNIQUE INDEX `Translation_translation_key_id_locale_id_key`(`translation_key_id`, `locale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationDraft` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `translation_key_id` INTEGER NOT NULL,
    `locale_id` INTEGER NOT NULL,
    `value` LONGTEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    INDEX `TranslationDraft_locale_id_idx`(`locale_id`),
    UNIQUE INDEX `TranslationDraft_translation_key_id_locale_id_key`(`translation_key_id`, `locale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `translation_id` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `value` LONGTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    INDEX `TranslationVersion_created_at_idx`(`created_at`),
    UNIQUE INDEX `TranslationVersion_translation_id_version_key`(`translation_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationAudit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `translation_key_id` INTEGER NULL,
    `locale_id` INTEGER NULL,
    `translation_id` INTEGER NULL,
    `action` ENUM('key_create', 'key_update', 'key_delete', 'draft_save', 'submit_review', 'publish', 'rollback', 'import', 'export', 'cache_invalidate') NOT NULL,
    `actor_id` INTEGER NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(512) NULL,
    `payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TranslationAudit_translation_key_id_created_at_idx`(`translation_key_id`, `created_at`),
    INDEX `TranslationAudit_actor_id_created_at_idx`(`actor_id`, `created_at`),
    INDEX `TranslationAudit_action_created_at_idx`(`action`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationJob` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('extract', 'sync', 'ai_translate', 'import_bundle', 'export_bundle', 'missing_scan', 'validate', 'review_pass', 'publish', 'rollback') NOT NULL,
    `status` ENUM('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `merchant_id` INTEGER NULL,
    `namespace_id` INTEGER NULL,
    `locale_id` INTEGER NULL,
    `payload` JSON NULL,
    `result` JSON NULL,
    `error_message` TEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `scheduled_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `TranslationJob_status_priority_scheduled_at_idx`(`status`, `priority`, `scheduled_at`),
    INDEX `TranslationJob_type_created_at_idx`(`type`, `created_at`),
    INDEX `TranslationJob_namespace_id_idx`(`namespace_id`),
    INDEX `TranslationJob_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationSource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `translation_id` INTEGER NOT NULL,
    `kind` ENUM('human', 'ai', 'file_import', 'api', 'migration') NOT NULL,
    `provider` VARCHAR(64) NULL,
    `external_ref` VARCHAR(255) NULL,
    `model` VARCHAR(128) NULL,
    `confidence` DECIMAL(5, 4) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TranslationSource_translation_id_idx`(`translation_id`),
    INDEX `TranslationSource_kind_created_at_idx`(`kind`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `translation_key_id` INTEGER NOT NULL,
    `translation_draft_id` INTEGER NOT NULL,
    `reviewer_id` INTEGER NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'changes_requested') NOT NULL DEFAULT 'pending',
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `TranslationReview_translation_key_id_status_idx`(`translation_key_id`, `status`),
    INDEX `TranslationReview_reviewer_id_idx`(`reviewer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationCache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cache_key` VARCHAR(512) NOT NULL,
    `namespace_id` INTEGER NULL,
    `locale_id` INTEGER NULL,
    `bundle_hash` VARCHAR(64) NOT NULL,
    `byte_size` INTEGER NULL,
    `expires_at` DATETIME(3) NULL,
    `invalidated_at` DATETIME(3) NULL,
    `edge_region` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TranslationCache_cache_key_key`(`cache_key`),
    INDEX `TranslationCache_namespace_id_locale_id_idx`(`namespace_id`, `locale_id`),
    INDEX `TranslationCache_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationMetric` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `day` DATE NOT NULL,
    `locale_id` INTEGER NOT NULL,
    `namespace_id` INTEGER NULL,
    `keys_total` INTEGER NOT NULL DEFAULT 0,
    `keys_translated` INTEGER NOT NULL DEFAULT 0,
    `keys_missing` INTEGER NOT NULL DEFAULT 0,
    `ai_tokens_used` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `TranslationMetric_day_locale_id_idx`(`day`, `locale_id`),
    INDEX `TranslationMetric_locale_id_namespace_id_idx`(`locale_id`, `namespace_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TranslationPermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `namespace_id` INTEGER NULL,
    `locale_id` INTEGER NULL,
    `permission` ENUM('namespace_read', 'namespace_write', 'publish', 'review', 'export', 'manage_locales') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `TranslationPermission_user_id_permission_idx`(`user_id`, `permission`),
    INDEX `TranslationPermission_namespace_id_idx`(`namespace_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EntityTranslation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NOT NULL DEFAULT 0,
    `entity_type` VARCHAR(128) NOT NULL,
    `entity_id` VARCHAR(64) NOT NULL,
    `field_path` VARCHAR(255) NOT NULL,
    `locale_id` INTEGER NOT NULL,
    `value` LONGTEXT NOT NULL,
    `status` ENUM('draft', 'in_review', 'published', 'archived') NOT NULL DEFAULT 'published',
    `author_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `EntityTranslation_merchant_id_entity_type_entity_id_idx`(`merchant_id`, `entity_type`, `entity_id`),
    INDEX `EntityTranslation_locale_id_status_idx`(`locale_id`, `status`),
    UNIQUE INDEX `EntityTranslation_entity_type_entity_id_field_path_locale_id_key`(`entity_type`, `entity_id`, `field_path`, `locale_id`, `merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocaleSlug` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(128) NOT NULL,
    `entity_id` VARCHAR(64) NOT NULL,
    `locale_id` INTEGER NOT NULL,
    `slug` VARCHAR(512) NOT NULL,
    `is_canonical` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `LocaleSlug_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    UNIQUE INDEX `LocaleSlug_locale_id_slug_key`(`locale_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_number` VARCHAR(191) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    `payment_status` ENUM('unpaid', 'paid', 'partial', 'refunded') NOT NULL DEFAULT 'unpaid',
    `payment_method` ENUM('card', 'paymob', 'fawry', 'kashier', 'stripe', 'cod', 'wallet', 'installment', 'bank_transfer') NOT NULL,
    `payment_reference` VARCHAR(191) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `shipping_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `coupon_code` VARCHAR(191) NULL,
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'EGP',
    `shipping_address_id` INTEGER NOT NULL,
    `billing_address_id` INTEGER NULL,
    `notes` TEXT NULL,
    `ip_address` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_order_number_key`(`order_number`),
    INDEX `Order_customer_id_created_at_idx`(`customer_id`, `created_at`),
    INDEX `Order_status_created_at_idx`(`status`, `created_at`),
    INDEX `Order_created_at_idx`(`created_at`),
    INDEX `Order_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'completed') NOT NULL DEFAULT 'pending',
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `shipping_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `commission_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `SubOrder_order_id_idx`(`order_id`),
    INDEX `SubOrder_merchant_id_idx`(`merchant_id`),
    INDEX `SubOrder_created_at_idx`(`created_at`),
    INDEX `SubOrder_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sub_order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `OrderItem_sub_order_id_idx`(`sub_order_id`),
    INDEX `OrderItem_product_id_idx`(`product_id`),
    INDEX `OrderItem_variant_id_idx`(`variant_id`),
    INDEX `OrderItem_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderTracking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `sub_order_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `OrderTracking_order_id_idx`(`order_id`),
    INDEX `OrderTracking_sub_order_id_idx`(`sub_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderTrackingEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `sub_order_id` INTEGER NULL,
    `actor_type` ENUM('system', 'merchant', 'admin', 'support', 'carrier', 'customer') NOT NULL,
    `actor_user_id` INTEGER NULL,
    `event_code` VARCHAR(64) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(255) NULL,
    `carrier_code` VARCHAR(64) NULL,
    `external_tracking_id` VARCHAR(128) NULL,
    `external_tracking_url` VARCHAR(1024) NULL,
    `metadata` JSON NULL,
    `visible_to_customer` BOOLEAN NOT NULL DEFAULT true,
    `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderTrackingEvent_order_id_occurred_at_idx`(`order_id`, `occurred_at`),
    INDEX `OrderTrackingEvent_sub_order_id_occurred_at_idx`(`sub_order_id`, `occurred_at`),
    INDEX `OrderTrackingEvent_actor_type_occurred_at_idx`(`actor_type`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Return` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_item_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `reason` ENUM('wrong_item', 'defective', 'not_as_described', 'changed_mind', 'other') NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'received', 'refunded') NOT NULL DEFAULT 'pending',
    `refund_method` ENUM('original_payment', 'wallet') NOT NULL,
    `requested_amount` DECIMAL(12, 2) NOT NULL,
    `approved_amount` DECIMAL(12, 2) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Return_order_item_id_idx`(`order_item_id`),
    INDEX `Return_customer_id_idx`(`customer_id`),
    INDEX `Return_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstallmentPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `provider` ENUM('sympl', 'valu', 'contact', 'shahry') NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'active', 'completed') NOT NULL DEFAULT 'pending',
    `tenure_months` INTEGER NOT NULL,
    `interest_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `monthly_amount` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `InstallmentPlan_order_id_idx`(`order_id`),
    INDEX `InstallmentPlan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('percentage', 'fixed', 'free_shipping', 'buy_x_get_y') NOT NULL,
    `value` DECIMAL(12, 2) NOT NULL,
    `max_discount_amount` DECIMAL(12, 2) NULL,
    `min_order_amount` DECIMAL(12, 2) NULL,
    `applicable_to` ENUM('all', 'specific_categories', 'specific_products') NOT NULL,
    `usage_limit` INTEGER NULL,
    `usage_limit_per_user` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CouponUsage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coupon_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `CouponUsage_coupon_id_idx`(`coupon_id`),
    INDEX `CouponUsage_customer_id_idx`(`customer_id`),
    INDEX `CouponUsage_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `invoice_number` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'issued', 'cancelled') NOT NULL DEFAULT 'pending',
    `issue_date` DATETIME(3) NULL,
    `due_date` DATETIME(3) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `pdf_url` VARCHAR(191) NULL,
    `archived_at` DATETIME(3) NULL,
    `archived_by_user_id` INTEGER NULL,
    `archive_uri` TEXT NULL,
    `archive_fingerprint` VARCHAR(128) NULL,
    `archive_tier` ENUM('hot', 'warm', 'cold') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoice_number_key`(`invoice_number`),
    INDEX `Invoice_order_id_idx`(`order_id`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_archived_at_idx`(`archived_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `gateway` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(3) NULL,
    `payload` JSON NOT NULL,
    `provider_response` JSON NULL,
    `failure_reason` VARCHAR(191) NULL,
    `signature` VARCHAR(191) NULL,
    `status` ENUM('pending', 'success', 'failed', 'refunded') NULL,
    `idempotency_key` VARCHAR(191) NOT NULL,
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentLog_idempotency_key_key`(`idempotency_key`),
    INDEX `PaymentLog_order_id_idx`(`order_id`),
    INDEX `PaymentLog_gateway_idx`(`gateway`),
    INDEX `PaymentLog_event_type_idx`(`event_type`),
    INDEX `PaymentLog_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wallet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_type` ENUM('merchant', 'customer', 'admin') NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Wallet_owner_type_owner_id_key`(`owner_type`, `owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WalletTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `wallet_id` INTEGER NOT NULL,
    `type` ENUM('credit', 'debit') NOT NULL,
    `category` ENUM('order_payment', 'commission', 'payout', 'refund', 'topup', 'bonus', 'adjustment') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `balance_before` DECIMAL(12, 2) NULL,
    `balance_after` DECIMAL(12, 2) NULL,
    `status` ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `reference_type` VARCHAR(191) NULL,
    `reference_id` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `WalletTransaction_wallet_id_idx`(`wallet_id`),
    INDEX `WalletTransaction_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sub_order_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `gross_amount` DECIMAL(12, 2) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('pending', 'clearing', 'cleared', 'paid') NOT NULL DEFAULT 'pending',
    `cleared_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Commission_sub_order_id_idx`(`sub_order_id`),
    INDEX `Commission_merchant_id_idx`(`merchant_id`),
    INDEX `Commission_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payout` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `method` ENUM('bank_transfer', 'wallet', 'instapay', 'check') NOT NULL,
    `status` ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    `reference` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Payout_merchant_id_idx`(`merchant_id`),
    INDEX `Payout_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Merchant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `store_name` VARCHAR(191) NOT NULL,
    `store_slug` VARCHAR(191) NOT NULL,
    `store_logo` VARCHAR(191) NULL,
    `store_banner` VARCHAR(191) NULL,
    `store_description` TEXT NULL,
    `business_type` ENUM('individual', 'company') NOT NULL,
    `tax_number` VARCHAR(191) NULL,
    `commercial_register` VARCHAR(191) NULL,
    `status` ENUM('pending', 'approved', 'suspended', 'rejected') NOT NULL DEFAULT 'pending',
    `rejection_reason` VARCHAR(191) NULL,
    `commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT 10,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `featured_until` DATETIME(3) NULL,
    `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `pending_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_sales` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `rating` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    `rating_count` INTEGER NOT NULL DEFAULT 0,
    `approved_at` DATETIME(3) NULL,
    `approved_by` INTEGER NULL,
    `deleted_at` DATETIME(3) NULL,
    `suspended_at` DATETIME(3) NULL,
    `suspension_reason` TEXT NULL,
    `banned_at` DATETIME(3) NULL,
    `ban_reason` TEXT NULL,
    `last_moderated_at` DATETIME(3) NULL,
    `last_moderated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Merchant_user_id_key`(`user_id`),
    UNIQUE INDEX `Merchant_store_slug_key`(`store_slug`),
    INDEX `Merchant_status_idx`(`status`),
    INDEX `Merchant_store_slug_idx`(`store_slug`),
    INDEX `Merchant_created_at_idx`(`created_at`),
    INDEX `Merchant_deleted_at_idx`(`deleted_at`),
    INDEX `Merchant_suspended_at_idx`(`suspended_at`),
    INDEX `Merchant_banned_at_idx`(`banned_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `brand_id` INTEGER NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description_ar` LONGTEXT NULL,
    `description_en` LONGTEXT NULL,
    `short_description_ar` TEXT NULL,
    `short_description_en` TEXT NULL,
    `product_type` ENUM('simple', 'variable', 'digital', 'bundle') NOT NULL DEFAULT 'simple',
    `status` ENUM('draft', 'pending_review', 'published', 'rejected', 'archived') NOT NULL DEFAULT 'draft',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `published_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `meta_title` VARCHAR(191) NULL,
    `meta_description` VARCHAR(191) NULL,
    `meta_keywords` VARCHAR(191) NULL,
    `canonical_url` VARCHAR(191) NULL,
    `search_keywords` TEXT NULL,
    `barcode` VARCHAR(191) NULL,
    `warranty_months` INTEGER NULL,
    `estimated_delivery_days` INTEGER NULL,
    `tax_class` VARCHAR(191) NULL,
    `requires_shipping` BOOLEAN NOT NULL DEFAULT true,
    `weight` DECIMAL(8, 2) NULL,
    `dimensions` JSON NULL,
    `tags` VARCHAR(191) NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `sales_count` INTEGER NOT NULL DEFAULT 0,
    `rating` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    `rating_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_merchant_id_status_idx`(`merchant_id`, `status`),
    INDEX `Product_slug_idx`(`slug`),
    INDEX `Product_created_at_idx`(`created_at`),
    INDEX `Product_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `compare_at_price` DECIMAL(12, 2) NULL,
    `cost_price` DECIMAL(12, 2) NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `reserved_quantity` INTEGER NOT NULL DEFAULT 0,
    `incoming_quantity` INTEGER NOT NULL DEFAULT 0,
    `damaged_quantity` INTEGER NOT NULL DEFAULT 0,
    `low_stock_threshold` INTEGER NULL,
    `barcode` VARCHAR(191) NULL,
    `weight` DECIMAL(8, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `ProductVariant_sku_key`(`sku`),
    INDEX `ProductVariant_product_id_idx`(`product_id`),
    INDEX `ProductVariant_stock_quantity_idx`(`stock_quantity`),
    INDEX `ProductVariant_created_at_idx`(`created_at`),
    INDEX `ProductVariant_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MerchantDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NOT NULL,
    `doc_type` ENUM('national_id', 'commercial_register', 'tax_card', 'bank_statement', 'other') NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    `rejection_reason` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `reviewed_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `MerchantDocument_merchant_id_status_idx`(`merchant_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MerchantSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NOT NULL,
    `return_policy` TEXT NULL,
    `shipping_policy` TEXT NULL,
    `min_order_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `auto_confirm_orders` BOOLEAN NOT NULL DEFAULT false,
    `processing_time_days` INTEGER NOT NULL DEFAULT 1,
    `notification_new_order` BOOLEAN NOT NULL DEFAULT true,
    `notification_low_stock` BOOLEAN NOT NULL DEFAULT true,
    `low_stock_threshold` INTEGER NOT NULL DEFAULT 5,
    `store_open` BOOLEAN NOT NULL DEFAULT true,
    `store_open_hours` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MerchantSettings_merchant_id_key`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description_ar` TEXT NULL,
    `description_en` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `meta_title` VARCHAR(191) NULL,
    `meta_description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_parent_id_idx`(`parent_id`),
    INDEX `Category_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `Brand_slug_key`(`slug`),
    INDEX `Brand_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attribute` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('select', 'color', 'text', 'number') NOT NULL,
    `is_global` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttributeValue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attribute_id` INTEGER NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `color_code` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AttributeValue_attribute_id_idx`(`attribute_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductRelation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `related_product_id` INTEGER NOT NULL,
    `relation_type` ENUM('related', 'upsell', 'cross_sell', 'bundle') NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProductRelation_product_id_idx`(`product_id`),
    UNIQUE INDEX `ProductRelation_product_id_related_product_id_relation_type_key`(`product_id`, `related_product_id`, `relation_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductAttribute` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `attribute_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductAttribute_product_id_attribute_id_key`(`product_id`, `attribute_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VariantAttributeValue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variant_id` INTEGER NOT NULL,
    `attribute_id` INTEGER NOT NULL,
    `attribute_value_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `VariantAttributeValue_variant_id_idx`(`variant_id`),
    UNIQUE INDEX `VariantAttributeValue_variant_id_attribute_id_key`(`variant_id`, `attribute_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `alt_text` VARCHAR(191) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProductImage_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VariantImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variant_id` INTEGER NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `alt_text` VARCHAR(191) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `VariantImage_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductFile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `download_limit` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProductFile_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variant_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `warehouse_id` INTEGER NULL,
    `action` ENUM('purchase', 'sale', 'return', 'adjustment', 'transfer', 'reserved', 'released') NOT NULL,
    `actor_role` ENUM('merchant_user', 'admin_user', 'support_user', 'system', 'automation') NOT NULL DEFAULT 'merchant_user',
    `quantity_change` INTEGER NOT NULL,
    `quantity_before` INTEGER NOT NULL,
    `quantity_after` INTEGER NOT NULL,
    `reference_type` VARCHAR(191) NULL,
    `reference_id` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `support_ticket_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `InventoryLog_variant_id_created_at_idx`(`variant_id`, `created_at`),
    INDEX `InventoryLog_merchant_id_idx`(`merchant_id`),
    INDEX `InventoryLog_warehouse_id_idx`(`warehouse_id`),
    INDEX `InventoryLog_support_ticket_id_idx`(`support_ticket_id`),
    INDEX `InventoryLog_actor_role_created_at_idx`(`actor_role`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockReservation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variant_id` INTEGER NOT NULL,
    `cart_id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `StockReservation_variant_id_idx`(`variant_id`),
    INDEX `StockReservation_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlashSale` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlashSaleItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `flash_sale_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NULL,
    `discount_type` ENUM('percentage', 'fixed') NOT NULL,
    `discount_value` DECIMAL(12, 2) NOT NULL,
    `max_qty` INTEGER NULL,
    `sold_qty` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `FlashSaleItem_flash_sale_id_idx`(`flash_sale_id`),
    INDEX `FlashSaleItem_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoyaltyPoint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `action` ENUM('earned', 'redeemed', 'expired') NOT NULL,
    `points` INTEGER NOT NULL,
    `reference_type` VARCHAR(191) NULL,
    `reference_id` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `LoyaltyPoint_customer_id_idx`(`customer_id`),
    INDEX `LoyaltyPoint_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoyaltyTier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` ENUM('bronze', 'silver', 'gold', 'platinum') NOT NULL,
    `min_points` INTEGER NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `benefits` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LoyaltyTier_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdCampaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NOT NULL,
    `type` ENUM('sponsored_product', 'featured_store', 'homepage_banner', 'search_boost', 'category_top') NOT NULL,
    `status` ENUM('draft', 'pending_payment', 'active', 'paused', 'completed', 'rejected') NOT NULL DEFAULT 'draft',
    `bidding_type` ENUM('cpc', 'cpm', 'fixed') NOT NULL,
    `budget` DECIMAL(12, 2) NOT NULL,
    `spent` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `bid_amount` DECIMAL(12, 2) NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `targeting` JSON NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AdCampaign_merchant_id_idx`(`merchant_id`),
    INDEX `AdCampaign_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdCampaignItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `item_type` ENUM('product', 'store', 'banner') NOT NULL,
    `product_id` INTEGER NULL,
    `store_id` INTEGER NULL,
    `banner_position` ENUM('hero', 'sidebar', 'inline', 'footer') NULL,
    `banner_image` VARCHAR(191) NULL,
    `banner_link` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AdCampaignItem_campaign_id_idx`(`campaign_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdAnalytic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `campaign_item_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `spend` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `revenue` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AdAnalytic_campaign_id_date_idx`(`campaign_id`, `date`),
    UNIQUE INDEX `AdAnalytic_campaign_id_date_campaign_item_id_key`(`campaign_id`, `date`, `campaign_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_id` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `method` ENUM('card', 'paymob', 'fawry', 'kashier', 'stripe', 'cod', 'wallet', 'installment', 'bank_transfer') NOT NULL,
    `status` ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `reference` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AdPayment_campaign_id_idx`(`campaign_id`),
    INDEX `AdPayment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingZone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cities` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingRate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `zone_id` INTEGER NOT NULL,
    `carrier` ENUM('bosta', 'mylerz', 'aramex', 'dhl', 'fedex', 'custom', 'platform') NOT NULL,
    `rate_type` ENUM('flat', 'weight_based', 'price_based', 'free') NOT NULL,
    `min_weight` DECIMAL(8, 2) NULL,
    `max_weight` DECIMAL(8, 2) NULL,
    `min_order_amount` DECIMAL(12, 2) NULL,
    `max_order_amount` DECIMAL(12, 2) NULL,
    `rate` DECIMAL(12, 2) NOT NULL,
    `estimated_days` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ShippingRate_zone_id_idx`(`zone_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `order_item_id` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `comment` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProductReview_product_id_idx`(`product_id`),
    INDEX `ProductReview_customer_id_idx`(`customer_id`),
    INDEX `ProductReview_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReviewHelpful` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `review_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `is_helpful` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ReviewHelpful_review_id_user_id_key`(`review_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `StoreReview_merchant_id_idx`(`merchant_id`),
    INDEX `StoreReview_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Market` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Market_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketMerchant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `market_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MarketMerchant_market_id_merchant_id_key`(`market_id`, `merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wishlist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Wishlist_customer_id_product_id_key`(`customer_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecentlyViewed` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RecentlyViewed_customer_id_product_id_key`(`customer_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportDefinition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NULL,
    `owner_user_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('sales', 'orders', 'products', 'inventory', 'payments', 'commissions', 'customers', 'marketing', 'hr', 'platform', 'custom') NOT NULL DEFAULT 'custom',
    `resource_type` VARCHAR(128) NOT NULL,
    `resource_id` VARCHAR(64) NULL,
    `spec` JSON NOT NULL,
    `default_format` ENUM('json', 'csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'json',
    `is_shared` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ReportDefinition_merchant_id_category_idx`(`merchant_id`, `category`),
    INDEX `ReportDefinition_merchant_id_is_active_idx`(`merchant_id`, `is_active`),
    INDEX `ReportDefinition_merchant_id_slug_idx`(`merchant_id`, `slug`),
    INDEX `ReportDefinition_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    INDEX `ReportDefinition_owner_user_id_idx`(`owner_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `report_definition_id` INTEGER NULL,
    `merchant_id` INTEGER NULL,
    `requested_by_user_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
    `parameters` JSON NULL,
    `format` ENUM('json', 'csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'json',
    `output_url` TEXT NULL,
    `output_key` VARCHAR(512) NULL,
    `output_mime` VARCHAR(128) NULL,
    `row_count` INTEGER NULL,
    `error_message` TEXT NULL,
    `idempotency_key` VARCHAR(191) NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ReportRun_idempotency_key_key`(`idempotency_key`),
    INDEX `ReportRun_merchant_id_status_created_at_idx`(`merchant_id`, `status`, `created_at`),
    INDEX `ReportRun_requested_by_user_id_created_at_idx`(`requested_by_user_id`, `created_at`),
    INDEX `ReportRun_report_definition_id_idx`(`report_definition_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `report_definition_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NULL,
    `frequency` ENUM('once', 'hourly', 'daily', 'weekly', 'monthly', 'cron') NOT NULL DEFAULT 'daily',
    `cron_expression` VARCHAR(128) NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Africa/Cairo',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `next_run_at` DATETIME(3) NULL,
    `last_run_at` DATETIME(3) NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ReportSchedule_merchant_id_is_active_idx`(`merchant_id`, `is_active`),
    INDEX `ReportSchedule_next_run_at_idx`(`next_run_at`),
    INDEX `ReportSchedule_report_definition_id_idx`(`report_definition_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchIndex` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(64) NOT NULL,
    `entity_int_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NULL,
    `title_ar` VARCHAR(512) NOT NULL,
    `title_en` VARCHAR(512) NOT NULL,
    `sku` VARCHAR(128) NULL,
    `barcode` VARCHAR(128) NULL,
    `product_slug` VARCHAR(512) NULL,
    `merchant_slug` VARCHAR(512) NULL,
    `merchant_store_name` VARCHAR(255) NULL,
    `primary_image_url` VARCHAR(1024) NULL,
    `search_blob` TEXT NOT NULL,
    `facets` JSON NULL,
    `popularity_score` INTEGER NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `SearchIndex_merchant_id_entity_type_idx`(`merchant_id`, `entity_type`),
    INDEX `SearchIndex_sku_idx`(`sku`),
    INDEX `SearchIndex_barcode_idx`(`barcode`),
    INDEX `SearchIndex_product_slug_idx`(`product_slug`),
    INDEX `SearchIndex_merchant_slug_idx`(`merchant_slug`),
    INDEX `SearchIndex_deleted_at_idx`(`deleted_at`),
    INDEX `SearchIndex_popularity_score_idx`(`popularity_score`),
    UNIQUE INDEX `SearchIndex_entity_type_entity_int_id_key`(`entity_type`, `entity_int_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteListingCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NULL,
    `slug` VARCHAR(128) NOT NULL,
    `name_ar` VARCHAR(255) NOT NULL,
    `name_en` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteListingCategory_slug_key`(`slug`),
    INDEX `SiteListingCategory_parent_id_idx`(`parent_id`),
    INDEX `SiteListingCategory_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteListing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `publisher_type` ENUM('admin', 'merchant') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `images` JSON NULL,
    `price` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(3) NULL,
    `location_label` VARCHAR(255) NULL,
    `contact_phone` VARCHAR(32) NULL,
    `contact_email` VARCHAR(255) NULL,
    `status` ENUM('draft', 'pending_review', 'rejected', 'published', 'expired', 'archived') NOT NULL DEFAULT 'pending_review',
    `reviewed_by_user_id` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `published_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `SiteListing_category_id_status_idx`(`category_id`, `status`),
    INDEX `SiteListing_merchant_id_status_idx`(`merchant_id`, `status`),
    INDEX `SiteListing_status_published_at_idx`(`status`, `published_at`),
    INDEX `SiteListing_created_by_user_id_idx`(`created_by_user_id`),
    INDEX `SiteListing_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('super_admin', 'admin', 'employee', 'merchant', 'customer') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `email_verified_at` DATETIME(3) NULL,
    `phone_verified_at` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `last_login_ip` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,
    `suspended_at` DATETIME(3) NULL,
    `suspension_reason` TEXT NULL,
    `banned_at` DATETIME(3) NULL,
    `ban_reason` TEXT NULL,
    `last_moderated_at` DATETIME(3) NULL,
    `last_moderated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_created_at_idx`(`created_at`),
    INDEX `User_deleted_at_idx`(`deleted_at`),
    INDEX `User_suspended_at_idx`(`suspended_at`),
    INDEX `User_banned_at_idx`(`banned_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `label` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NULL,
    `street` VARCHAR(191) NOT NULL,
    `building` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `apartment` VARCHAR(191) NULL,
    `postal_code` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Address_user_id_idx`(`user_id`),
    INDEX `Address_city_country_idx`(`city`, `country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` VARCHAR(191) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cart_customer_id_key`(`customer_id`),
    INDEX `Cart_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cart_id` VARCHAR(191) NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `CartItem_variant_id_idx`(`variant_id`),
    UNIQUE INDEX `CartItem_cart_id_variant_id_key`(`cart_id`, `variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `manager_id` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Department_code_key`(`code`),
    INDEX `Department_manager_id_idx`(`manager_id`),
    UNIQUE INDEX `Department_manager_id_key`(`manager_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `employee_code` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `salary` DECIMAL(12, 2) NOT NULL,
    `hire_date` DATE NOT NULL,
    `national_id` VARCHAR(191) NOT NULL,
    `national_id_scan` VARCHAR(191) NULL,
    `contract_type` ENUM('full_time', 'part_time', 'contract') NOT NULL,
    `contract_file` VARCHAR(191) NULL,
    `emergency_contact_name` VARCHAR(191) NULL,
    `emergency_contact_phone` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'terminated') NOT NULL DEFAULT 'active',
    `terminated_at` DATETIME(3) NULL,
    `termination_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_user_id_key`(`user_id`),
    UNIQUE INDEX `Employee_employee_code_key`(`employee_code`),
    UNIQUE INDEX `Employee_national_id_key`(`national_id`),
    INDEX `Employee_user_id_idx`(`user_id`),
    INDEX `Employee_department_id_idx`(`department_id`),
    INDEX `Employee_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `check_in` DATETIME(3) NULL,
    `check_out` DATETIME(3) NULL,
    `status` ENUM('present', 'absent', 'late', 'half_day', 'on_leave') NOT NULL,
    `late_minutes` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Attendance_employee_id_date_idx`(`employee_id`, `date`),
    UNIQUE INDEX `Attendance_employee_id_date_key`(`employee_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `type` ENUM('annual', 'sick', 'emergency', 'unpaid') NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `total_days` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `LeaveRequest_employee_id_status_idx`(`employee_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payroll` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `basic_salary` DECIMAL(12, 2) NOT NULL,
    `allowances` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `net_salary` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('draft', 'approved', 'paid') NOT NULL DEFAULT 'draft',
    `paid_at` DATETIME(3) NULL,
    `payslip_url` VARCHAR(191) NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Payroll_employee_id_year_idx`(`employee_id`, `year`),
    UNIQUE INDEX `Payroll_employee_id_month_year_key`(`employee_id`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `channel_default` ENUM('in_app', 'email', 'sms', 'push') NULL,
    `title_template` VARCHAR(255) NOT NULL,
    `message_template` TEXT NOT NULL,
    `payload_schema` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationTemplate_code_key`(`code`),
    INDEX `NotificationTemplate_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `channel` ENUM('in_app', 'email', 'sms', 'push') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `payload` JSON NULL,
    `template_id` VARCHAR(191) NULL,
    `notification_template_id` INTEGER NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `failed_at` DATETIME(3) NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Notification_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `Notification_notification_template_id_idx`(`notification_template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationPreference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `order_updates` BOOLEAN NOT NULL DEFAULT true,
    `promotions` BOOLEAN NOT NULL DEFAULT true,
    `support` BOOLEAN NOT NULL DEFAULT true,
    `email_enabled` BOOLEAN NOT NULL DEFAULT true,
    `sms_enabled` BOOLEAN NOT NULL DEFAULT false,
    `push_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationPreference_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportTicket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_number` VARCHAR(191) NOT NULL,
    `customer_id` INTEGER NULL,
    `merchant_id` INTEGER NULL,
    `assigned_to` INTEGER NULL,
    `category` ENUM('order', 'payment', 'product', 'shipping', 'account', 'other') NOT NULL,
    `status` ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `last_reply_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SupportTicket_ticket_number_key`(`ticket_number`),
    INDEX `SupportTicket_status_priority_idx`(`status`, `priority`),
    INDEX `SupportTicket_customer_id_idx`(`customer_id`),
    INDEX `SupportTicket_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `sender_type` ENUM('customer', 'merchant', 'employee', 'admin') NOT NULL,
    `message` TEXT NOT NULL,
    `attachments` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `SupportMessage_ticket_id_idx`(`ticket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Warehouse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_type` ENUM('platform', 'merchant') NOT NULL,
    `merchant_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `description` TEXT NULL,
    `country` VARCHAR(64) NULL,
    `city` VARCHAR(128) NULL,
    `address_line` TEXT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Warehouse_owner_type_merchant_id_code_idx`(`owner_type`, `merchant_id`, `code`),
    INDEX `Warehouse_merchant_id_is_active_idx`(`merchant_id`, `is_active`),
    INDEX `Warehouse_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WarehouseStock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `warehouse_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `quantity_on_hand` INTEGER NOT NULL DEFAULT 0,
    `quantity_reserved` INTEGER NOT NULL DEFAULT 0,
    `quantity_damaged` INTEGER NOT NULL DEFAULT 0,
    `reorder_point` INTEGER NULL,
    `last_counted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `WarehouseStock_variant_id_idx`(`variant_id`),
    INDEX `WarehouseStock_warehouse_id_idx`(`warehouse_id`),
    UNIQUE INDEX `WarehouseStock_warehouse_id_variant_id_key`(`warehouse_id`, `variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeePermission` ADD CONSTRAINT `EmployeePermission_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeePermission` ADD CONSTRAINT `EmployeePermission_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Locale` ADD CONSTRAINT `Locale_inherit_from_id_fkey` FOREIGN KEY (`inherit_from_id`) REFERENCES `Locale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocaleFallback` ADD CONSTRAINT `LocaleFallback_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocaleFallback` ADD CONSTRAINT `LocaleFallback_fallback_locale_id_fkey` FOREIGN KEY (`fallback_locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationNamespace` ADD CONSTRAINT `TranslationNamespace_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationKey` ADD CONSTRAINT `TranslationKey_namespace_id_fkey` FOREIGN KEY (`namespace_id`) REFERENCES `TranslationNamespace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Translation` ADD CONSTRAINT `Translation_translation_key_id_fkey` FOREIGN KEY (`translation_key_id`) REFERENCES `TranslationKey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Translation` ADD CONSTRAINT `Translation_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Translation` ADD CONSTRAINT `Translation_published_by_fkey` FOREIGN KEY (`published_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationDraft` ADD CONSTRAINT `TranslationDraft_translation_key_id_fkey` FOREIGN KEY (`translation_key_id`) REFERENCES `TranslationKey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationDraft` ADD CONSTRAINT `TranslationDraft_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationDraft` ADD CONSTRAINT `TranslationDraft_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationVersion` ADD CONSTRAINT `TranslationVersion_translation_id_fkey` FOREIGN KEY (`translation_id`) REFERENCES `Translation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationVersion` ADD CONSTRAINT `TranslationVersion_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationAudit` ADD CONSTRAINT `TranslationAudit_translation_key_id_fkey` FOREIGN KEY (`translation_key_id`) REFERENCES `TranslationKey`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationAudit` ADD CONSTRAINT `TranslationAudit_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationAudit` ADD CONSTRAINT `TranslationAudit_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationJob` ADD CONSTRAINT `TranslationJob_namespace_id_fkey` FOREIGN KEY (`namespace_id`) REFERENCES `TranslationNamespace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationJob` ADD CONSTRAINT `TranslationJob_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationJob` ADD CONSTRAINT `TranslationJob_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationSource` ADD CONSTRAINT `TranslationSource_translation_id_fkey` FOREIGN KEY (`translation_id`) REFERENCES `Translation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationReview` ADD CONSTRAINT `TranslationReview_translation_key_id_fkey` FOREIGN KEY (`translation_key_id`) REFERENCES `TranslationKey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationReview` ADD CONSTRAINT `TranslationReview_translation_draft_id_fkey` FOREIGN KEY (`translation_draft_id`) REFERENCES `TranslationDraft`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationReview` ADD CONSTRAINT `TranslationReview_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationCache` ADD CONSTRAINT `TranslationCache_namespace_id_fkey` FOREIGN KEY (`namespace_id`) REFERENCES `TranslationNamespace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationCache` ADD CONSTRAINT `TranslationCache_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationMetric` ADD CONSTRAINT `TranslationMetric_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationMetric` ADD CONSTRAINT `TranslationMetric_namespace_id_fkey` FOREIGN KEY (`namespace_id`) REFERENCES `TranslationNamespace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationPermission` ADD CONSTRAINT `TranslationPermission_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationPermission` ADD CONSTRAINT `TranslationPermission_namespace_id_fkey` FOREIGN KEY (`namespace_id`) REFERENCES `TranslationNamespace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TranslationPermission` ADD CONSTRAINT `TranslationPermission_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntityTranslation` ADD CONSTRAINT `EntityTranslation_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntityTranslation` ADD CONSTRAINT `EntityTranslation_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocaleSlug` ADD CONSTRAINT `LocaleSlug_locale_id_fkey` FOREIGN KEY (`locale_id`) REFERENCES `Locale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_shipping_address_id_fkey` FOREIGN KEY (`shipping_address_id`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_billing_address_id_fkey` FOREIGN KEY (`billing_address_id`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubOrder` ADD CONSTRAINT `SubOrder_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubOrder` ADD CONSTRAINT `SubOrder_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_sub_order_id_fkey` FOREIGN KEY (`sub_order_id`) REFERENCES `SubOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderTracking` ADD CONSTRAINT `OrderTracking_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderTracking` ADD CONSTRAINT `OrderTracking_sub_order_id_fkey` FOREIGN KEY (`sub_order_id`) REFERENCES `SubOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderTrackingEvent` ADD CONSTRAINT `OrderTrackingEvent_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderTrackingEvent` ADD CONSTRAINT `OrderTrackingEvent_sub_order_id_fkey` FOREIGN KEY (`sub_order_id`) REFERENCES `SubOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderTrackingEvent` ADD CONSTRAINT `OrderTrackingEvent_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Return` ADD CONSTRAINT `Return_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Return` ADD CONSTRAINT `Return_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstallmentPlan` ADD CONSTRAINT `InstallmentPlan_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponUsage` ADD CONSTRAINT `CouponUsage_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponUsage` ADD CONSTRAINT `CouponUsage_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponUsage` ADD CONSTRAINT `CouponUsage_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_archived_by_user_id_fkey` FOREIGN KEY (`archived_by_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLog` ADD CONSTRAINT `PaymentLog_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTransaction` ADD CONSTRAINT `WalletTransaction_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `Wallet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTransaction` ADD CONSTRAINT `WalletTransaction_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_sub_order_id_fkey` FOREIGN KEY (`sub_order_id`) REFERENCES `SubOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Merchant` ADD CONSTRAINT `Merchant_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Merchant` ADD CONSTRAINT `Merchant_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Merchant` ADD CONSTRAINT `Merchant_last_moderated_by_fkey` FOREIGN KEY (`last_moderated_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantDocument` ADD CONSTRAINT `MerchantDocument_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantDocument` ADD CONSTRAINT `MerchantDocument_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantSettings` ADD CONSTRAINT `MerchantSettings_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttributeValue` ADD CONSTRAINT `AttributeValue_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `Attribute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductRelation` ADD CONSTRAINT `ProductRelation_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductRelation` ADD CONSTRAINT `ProductRelation_related_product_id_fkey` FOREIGN KEY (`related_product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAttribute` ADD CONSTRAINT `ProductAttribute_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAttribute` ADD CONSTRAINT `ProductAttribute_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `Attribute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `Attribute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantAttributeValue` ADD CONSTRAINT `VariantAttributeValue_attribute_value_id_fkey` FOREIGN KEY (`attribute_value_id`) REFERENCES `AttributeValue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantImage` ADD CONSTRAINT `VariantImage_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductFile` ADD CONSTRAINT `ProductFile_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_support_ticket_id_fkey` FOREIGN KEY (`support_ticket_id`) REFERENCES `SupportTicket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReservation` ADD CONSTRAINT `StockReservation_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReservation` ADD CONSTRAINT `StockReservation_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlashSaleItem` ADD CONSTRAINT `FlashSaleItem_flash_sale_id_fkey` FOREIGN KEY (`flash_sale_id`) REFERENCES `FlashSale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlashSaleItem` ADD CONSTRAINT `FlashSaleItem_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlashSaleItem` ADD CONSTRAINT `FlashSaleItem_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoyaltyPoint` ADD CONSTRAINT `LoyaltyPoint_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdCampaign` ADD CONSTRAINT `AdCampaign_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdCampaignItem` ADD CONSTRAINT `AdCampaignItem_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdCampaignItem` ADD CONSTRAINT `AdCampaignItem_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdCampaignItem` ADD CONSTRAINT `AdCampaignItem_store_id_fkey` FOREIGN KEY (`store_id`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdAnalytic` ADD CONSTRAINT `AdAnalytic_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdAnalytic` ADD CONSTRAINT `AdAnalytic_campaign_item_id_fkey` FOREIGN KEY (`campaign_item_id`) REFERENCES `AdCampaignItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdPayment` ADD CONSTRAINT `AdPayment_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShippingRate` ADD CONSTRAINT `ShippingRate_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `ShippingZone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReview` ADD CONSTRAINT `ProductReview_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReview` ADD CONSTRAINT `ProductReview_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReview` ADD CONSTRAINT `ProductReview_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `OrderItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewHelpful` ADD CONSTRAINT `ReviewHelpful_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `ProductReview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewHelpful` ADD CONSTRAINT `ReviewHelpful_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreReview` ADD CONSTRAINT `StoreReview_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreReview` ADD CONSTRAINT `StoreReview_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketMerchant` ADD CONSTRAINT `MarketMerchant_market_id_fkey` FOREIGN KEY (`market_id`) REFERENCES `Market`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketMerchant` ADD CONSTRAINT `MarketMerchant_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wishlist` ADD CONSTRAINT `Wishlist_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wishlist` ADD CONSTRAINT `Wishlist_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecentlyViewed` ADD CONSTRAINT `RecentlyViewed_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecentlyViewed` ADD CONSTRAINT `RecentlyViewed_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportDefinition` ADD CONSTRAINT `ReportDefinition_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportDefinition` ADD CONSTRAINT `ReportDefinition_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportRun` ADD CONSTRAINT `ReportRun_report_definition_id_fkey` FOREIGN KEY (`report_definition_id`) REFERENCES `ReportDefinition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportRun` ADD CONSTRAINT `ReportRun_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportRun` ADD CONSTRAINT `ReportRun_requested_by_user_id_fkey` FOREIGN KEY (`requested_by_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportSchedule` ADD CONSTRAINT `ReportSchedule_report_definition_id_fkey` FOREIGN KEY (`report_definition_id`) REFERENCES `ReportDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportSchedule` ADD CONSTRAINT `ReportSchedule_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportSchedule` ADD CONSTRAINT `ReportSchedule_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchIndex` ADD CONSTRAINT `SearchIndex_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteListingCategory` ADD CONSTRAINT `SiteListingCategory_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `SiteListingCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteListing` ADD CONSTRAINT `SiteListing_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `SiteListingCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteListing` ADD CONSTRAINT `SiteListing_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteListing` ADD CONSTRAINT `SiteListing_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteListing` ADD CONSTRAINT `SiteListing_reviewed_by_user_id_fkey` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_last_moderated_by_fkey` FOREIGN KEY (`last_moderated_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cart` ADD CONSTRAINT `Cart_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_notification_template_id_fkey` FOREIGN KEY (`notification_template_id`) REFERENCES `NotificationTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationPreference` ADD CONSTRAINT `NotificationPreference_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Warehouse` ADD CONSTRAINT `Warehouse_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarehouseStock` ADD CONSTRAINT `WarehouseStock_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `Warehouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WarehouseStock` ADD CONSTRAINT `WarehouseStock_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
