-- Links do relatório mensal pro médico (ver model ReportShare). Só acrescenta.
CREATE TABLE "ReportShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReportShare_token_key" ON "ReportShare"("token");
CREATE INDEX "ReportShare_userId_idx" ON "ReportShare"("userId");

ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
