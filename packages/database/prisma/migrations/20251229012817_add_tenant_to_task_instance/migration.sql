/*
  Warnings:

  - Added the required column `tenantId` to the `TaskInstance` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "assignee" TEXT,
    "status" TEXT NOT NULL,
    "formData" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "completedBy" TEXT,
    "comment" TEXT,
    CONSTRAINT "TaskInstance_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskInstance" ("assignee", "comment", "completedAt", "completedBy", "createdAt", "dueDate", "formData", "id", "instanceId", "nodeId", "nodeName", "nodeType", "status") SELECT "assignee", "comment", "completedAt", "completedBy", "createdAt", "dueDate", "formData", "id", "instanceId", "nodeId", "nodeName", "nodeType", "status" FROM "TaskInstance";
DROP TABLE "TaskInstance";
ALTER TABLE "new_TaskInstance" RENAME TO "TaskInstance";
CREATE INDEX "TaskInstance_tenantId_assignee_status_idx" ON "TaskInstance"("tenantId", "assignee", "status");
CREATE INDEX "TaskInstance_tenantId_instanceId_status_idx" ON "TaskInstance"("tenantId", "instanceId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
