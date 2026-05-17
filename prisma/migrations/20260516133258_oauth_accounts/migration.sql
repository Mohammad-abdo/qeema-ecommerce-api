-- AlterTable
ALTER TABLE `user` MODIFY `password_hash` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UserOAuthAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `UserOAuthAccount_user_id_idx`(`user_id`),
    UNIQUE INDEX `UserOAuthAccount_provider_provider_id_key`(`provider`, `provider_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserOAuthAccount` ADD CONSTRAINT `UserOAuthAccount_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
