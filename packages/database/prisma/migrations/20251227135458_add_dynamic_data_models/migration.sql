-- CreateTable
CREATE TABLE "DataModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "fields" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "timestamps" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DynamicRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DynamicRecord_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DataModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DataModel_tenantId_idx" ON "DataModel"("tenantId");

-- CreateIndex
CREATE INDEX "DataModel_status_idx" ON "DataModel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DataModel_tenantId_entityName_key" ON "DataModel"("tenantId", "entityName");

-- CreateIndex
CREATE INDEX "DynamicRecord_tenantId_idx" ON "DynamicRecord"("tenantId");

-- CreateIndex
CREATE INDEX "DynamicRecord_modelId_idx" ON "DynamicRecord"("modelId");
