-- AlterTable
ALTER TABLE `Product` ADD COLUMN `external_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Product_external_id_key` ON `Product`(`external_id`);

-- CreateIndex
CREATE INDEX `Product_external_id_idx` ON `Product`(`external_id`);
