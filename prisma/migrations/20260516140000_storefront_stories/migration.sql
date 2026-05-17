-- CreateTable
CREATE TABLE `StorefrontStory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_name` VARCHAR(191) NOT NULL,
    `vendor_name_tr` VARCHAR(191) NULL,
    `vendor_name_ar` VARCHAR(191) NULL,
    `merchant_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `link_type` VARCHAR(191) NOT NULL DEFAULT 'product',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `StorefrontStory_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorefrontStoryItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `story_id` INTEGER NOT NULL,
    `thumbnail` VARCHAR(191) NULL,
    `media_url` VARCHAR(191) NOT NULL,
    `media_type` VARCHAR(191) NOT NULL DEFAULT 'image',
    `duration` INTEGER NOT NULL DEFAULT 5,
    `link_type` VARCHAR(191) NOT NULL DEFAULT 'product',
    `link_id` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `StorefrontStoryItem_story_id_sort_order_idx`(`story_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StorefrontStoryItem` ADD CONSTRAINT `StorefrontStoryItem_story_id_fkey` FOREIGN KEY (`story_id`) REFERENCES `StorefrontStory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
