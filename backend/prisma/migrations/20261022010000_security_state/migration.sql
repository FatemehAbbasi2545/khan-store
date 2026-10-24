BEGIN;
ALTER TABLE "Cart" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "checkoutKey" TEXT,
  ADD COLUMN "sourceCartId" TEXT,
  ADD COLUMN "sourceCartRevision" INTEGER,
  ADD COLUMN "paymentRequestStartedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");
CREATE TABLE "CaptchaChallenge" (
  "id" TEXT PRIMARY KEY, "answerHash" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "CaptchaChallenge_expiresAt_idx" ON "CaptchaChallenge"("expiresAt");
CREATE TABLE "RateLimitBucket" (
  "id" TEXT PRIMARY KEY, "count" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
COMMIT;
