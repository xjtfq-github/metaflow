-- CreateTable
CREATE TABLE "CustomScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'javascript',
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT,
    "triggerConfig" TEXT,
    "timeout" INTEGER NOT NULL DEFAULT 5000,
    "memoryLimit" INTEGER NOT NULL DEFAULT 128,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScriptExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "logs" TEXT,
    "errors" TEXT,
    "executionTime" INTEGER,
    "memoryUsed" INTEGER,
    "triggeredBy" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ScriptExecution_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "CustomScript" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" TEXT,
    "scriptId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Webhook_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "CustomScript" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webhookId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "headers" TEXT NOT NULL,
    "body" TEXT,
    "query" TEXT,
    "status" INTEGER,
    "response" TEXT,
    "error" TEXT,
    "responseTime" INTEGER,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookRequest_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "credentials" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CustomScript_tenantId_idx" ON "CustomScript"("tenantId");

-- CreateIndex
CREATE INDEX "CustomScript_enabled_idx" ON "CustomScript"("enabled");

-- CreateIndex
CREATE INDEX "ScriptExecution_scriptId_idx" ON "ScriptExecution"("scriptId");

-- CreateIndex
CREATE INDEX "ScriptExecution_status_idx" ON "ScriptExecution"("status");

-- CreateIndex
CREATE INDEX "ScriptExecution_startedAt_idx" ON "ScriptExecution"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_url_key" ON "Webhook"("url");

-- CreateIndex
CREATE INDEX "Webhook_tenantId_idx" ON "Webhook"("tenantId");

-- CreateIndex
CREATE INDEX "Webhook_enabled_idx" ON "Webhook"("enabled");

-- CreateIndex
CREATE INDEX "WebhookRequest_webhookId_idx" ON "WebhookRequest"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookRequest_receivedAt_idx" ON "WebhookRequest"("receivedAt");

-- CreateIndex
CREATE INDEX "Connector_tenantId_idx" ON "Connector"("tenantId");

-- CreateIndex
CREATE INDEX "Connector_type_idx" ON "Connector"("type");
