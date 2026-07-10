-- CreateTable
CREATE TABLE "PoRule" (
    "id" SERIAL NOT NULL,
    "contactAccount" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "scanningRules" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoRule_contactAccount_idx" ON "PoRule"("contactAccount");

-- CreateIndex
CREATE INDEX "PoRule_contactAccount_priority_idx" ON "PoRule"("contactAccount", "priority");

-- AddForeignKey
ALTER TABLE "PoRule" ADD CONSTRAINT "PoRule_contactAccount_fkey" FOREIGN KEY ("contactAccount") REFERENCES "Contact"("account") ON DELETE CASCADE ON UPDATE CASCADE;
