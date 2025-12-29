/*
  Warnings:

  - Added the required column `tenantId` to the `WorkflowToken` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkflowToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "parentTokenId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "WorkflowToken_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowToken" ("completedAt", "createdAt", "id", "instanceId", "nodeId", "parentTokenId", "status") SELECT "completedAt", "createdAt", "id", "instanceId", "nodeId", "parentTokenId", "status" FROM "WorkflowToken";
DROP TABLE "WorkflowToken";
ALTER TABLE "new_WorkflowToken" RENAME TO "WorkflowToken";
CREATE INDEX "WorkflowToken_instanceId_status_idx" ON "WorkflowToken"("instanceId", "status");
CREATE INDEX "WorkflowToken_tenantId_idx" ON "WorkflowToken"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
