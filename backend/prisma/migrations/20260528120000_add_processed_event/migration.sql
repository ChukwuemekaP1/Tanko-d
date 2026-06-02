-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL UNIQUE,
    "ledgerSequence" INTEGER NOT NULL,
    "contractId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ProcessedEvent_ledgerSequence_idx" ON "ProcessedEvent"("ledgerSequence");

-- CreateIndex
CREATE INDEX "ProcessedEvent_contractId_idx" ON "ProcessedEvent"("contractId");