-- CreateTable
CREATE TABLE "standardized_listing" (
    "id" SERIAL NOT NULL,
    "listing_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_per_m2" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "size_m2" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standardized_listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "standardized_listing_listing_id_idx" ON "standardized_listing"("listing_id");
