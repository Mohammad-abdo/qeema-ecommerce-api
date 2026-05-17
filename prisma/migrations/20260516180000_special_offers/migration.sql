-- CreateTable
CREATE TABLE `SpecialOffer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `title_en` VARCHAR(191) NOT NULL,
    `title_ar` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description_en` TEXT NULL,
    `description_ar` TEXT NULL,
    `image_url` VARCHAR(191) NULL,
    `bundle_price` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('draft', 'active', 'paused', 'expired') NOT NULL DEFAULT 'draft',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SpecialOffer_slug_key`(`slug`),
    INDEX `SpecialOffer_merchant_id_status_idx`(`merchant_id`, `status`),
    INDEX `SpecialOffer_status_starts_at_ends_at_idx`(`status`, `starts_at`, `ends_at`),
    INDEX `SpecialOffer_slug_idx`(`slug`),
    INDEX `SpecialOffer_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialOfferItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `special_offer_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `SpecialOfferItem_special_offer_id_idx`(`special_offer_id`),
    INDEX `SpecialOfferItem_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SpecialOffer` ADD CONSTRAINT `SpecialOffer_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialOffer` ADD CONSTRAINT `SpecialOffer_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialOfferItem` ADD CONSTRAINT `SpecialOfferItem_special_offer_id_fkey` FOREIGN KEY (`special_offer_id`) REFERENCES `SpecialOffer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialOfferItem` ADD CONSTRAINT `SpecialOfferItem_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialOfferItem` ADD CONSTRAINT `SpecialOfferItem_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
