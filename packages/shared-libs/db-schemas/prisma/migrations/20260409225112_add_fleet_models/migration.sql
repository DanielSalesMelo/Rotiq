-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseCategory" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");
