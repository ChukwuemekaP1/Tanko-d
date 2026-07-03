ALTER TABLE "User" ADD COLUMN "avalancheCChainAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "avalancheChainId" TEXT;

CREATE UNIQUE INDEX "User_avalancheCChainAddress_key" ON "User"("avalancheCChainAddress");
CREATE INDEX "User_avalancheChainId_idx" ON "User"("avalancheChainId");
