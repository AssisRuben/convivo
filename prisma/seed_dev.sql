-- ============================================================
-- 1) Migration do Cartão Fidelidade (rodar primeiro)
-- Equivalente a prisma/migrations/20260820020000_add_loyalty_stamp_card
-- ============================================================
ALTER TYPE "WalletEntrySource" ADD VALUE 'LOYALTY_STAMP_REWARD';

CREATE TABLE "LoyaltyStampCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "rewardCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyStampCycle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoyaltyStampCycle_userId_cycleNumber_key" ON "LoyaltyStampCycle"("userId", "cycleNumber");

ALTER TABLE "LoyaltyStampCycle" ADD CONSTRAINT "LoyaltyStampCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- IMPORTANTE: rode o bloco acima primeiro e SOZINHO (ou pelo menos até o
-- fim do ALTER TYPE), depois rode o resto. O Postgres não deixa usar um
-- valor de enum recém-adicionado (LOYALTY_STAMP_REWARD) na mesma transação
-- em que ele foi criado — como este seed não usa esse valor, não há
-- problema, mas se colar tudo de uma vez em editores que abrem uma
-- transação por clique em "Run", pode dar erro. Se der erro de "unsafe use
-- of new value", rode o ALTER TYPE isolado primeiro e o resto depois.

-- ============================================================
-- 1b) Migration de Medicamentos (rastreamento de uso, recompra de 1
-- clique, lembretes push)
-- Equivalente a prisma/migrations/20260820030000_add_medication_tracking
-- ============================================================
CREATE TABLE "MedicationTracking" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "productName"   TEXT NOT NULL,
  "codigoProduto" INTEGER,
  "purchaseDate"  TIMESTAMP(3) NOT NULL,
  "totalUnits"    INTEGER NOT NULL,
  "unitsPerDose"  INTEGER NOT NULL,
  "active"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MedicationTracking_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicationTracking"
  ADD CONSTRAINT "MedicationTracking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "MedicationTracking_userId_idx" ON "MedicationTracking"("userId");

CREATE TABLE "MedicationRepurchaseAlert" (
  "id"                   TEXT NOT NULL,
  "medicationTrackingId" TEXT NOT NULL,
  "sentAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MedicationRepurchaseAlert_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicationRepurchaseAlert"
  ADD CONSTRAINT "MedicationRepurchaseAlert_medicationTrackingId_fkey"
  FOREIGN KEY ("medicationTrackingId") REFERENCES "MedicationTracking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "MedicationRepurchaseAlert_medicationTrackingId_key"
  ON "MedicationRepurchaseAlert"("medicationTrackingId");

CREATE TABLE "ExpoPushToken" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ExpoPushToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpoPushToken_token_key" ON "ExpoPushToken"("token");

ALTER TABLE "ExpoPushToken"
  ADD CONSTRAINT "ExpoPushToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CareChecklistItem" ADD COLUMN "medicationTrackingId" TEXT;

ALTER TABLE "CareChecklistItem"
  ADD CONSTRAINT "CareChecklistItem_medicationTrackingId_fkey"
  FOREIGN KEY ("medicationTrackingId") REFERENCES "MedicationTracking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 2) Seed de 3 contas: Ana indicou Bruno e Carla, e já acumulou comissão
-- de indicação (saldo/pontuação) das compras dos dois.
-- Senha das 3 contas: Convivo123!
-- ============================================================
INSERT INTO "User" (
  "id", "name", "email", "passwordHash",
  "referralCode", "referredById", "createdAt",
  "conditions", "allergies"
) VALUES
  (
    '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2', 'Ana Souza', 'ana@convivo.dev',
    '$2b$10$9LxPIO2LhpvGVNPSUMMCF.dueCjXJN8TPyRb1PBGZeRO99CKKakRS',
    'AN4X9KL', NULL, now(),
    ARRAY[]::TEXT[], ARRAY[]::TEXT[]
  ),
  (
    'a34da414-effd-4132-a98d-f301a054c949', 'Bruno Lima', 'bruno@convivo.dev',
    '$2b$10$9LxPIO2LhpvGVNPSUMMCF.dueCjXJN8TPyRb1PBGZeRO99CKKakRS',
    'BR7GHPZ', '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2', now(),
    ARRAY[]::TEXT[], ARRAY[]::TEXT[]
  ),
  (
    '8cc9b394-7304-473e-a812-01c26ede91f1', 'Carla Nunes', 'carla@convivo.dev',
    '$2b$10$9LxPIO2LhpvGVNPSUMMCF.dueCjXJN8TPyRb1PBGZeRO99CKKakRS',
    'CR3MNQY', '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2', now(),
    ARRAY[]::TEXT[], ARRAY[]::TEXT[]
  );

-- Carteira da Ana: comissão de 2% já creditada por compras passadas de
-- Bruno e Carla (mesmo formato usado por creditReferralCommission em
-- src/lib/orders/orderCore.ts).
INSERT INTO "WalletEntry" ("id", "userId", "amountCents", "source", "description", "createdAt")
VALUES
  (
    gen_random_uuid()::text, '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2', 320,
    'REFERRAL_PURCHASE_COMMISSION', 'Comissão de 2% pela compra de Bruno Lima', now()
  ),
  (
    gen_random_uuid()::text, '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2', 540,
    'REFERRAL_PURCHASE_COMMISSION', 'Comissão de 2% pela compra de Carla Nunes', now()
  );

-- Registra a conquista de "1 amigo indicado" pra Ana, pra já aparecer em
-- Minhas postagens / feed com o bichinho na fase inicial (mesma lógica de
-- checkReferralMilestones em src/lib/timeline/achievements.ts).
INSERT INTO "TimelineEvent" (
  "id", "userId", "type", "title", "message", "occurredAt", "createdAt",
  "goalType", "milestoneValue", "stage"
) VALUES (
  gen_random_uuid()::text, '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2',
  'ACHIEVEMENT_REFERRAL_MILESTONE', '1 amigo indicado! 🎉',
  'Você já tem 1 amigo indicado usando o Convivo. Seu bichinho está crescendo!',
  now(), now(), 'INDICACAO', 1, 0
);

-- ============================================================
-- Contas resultantes (login em /login com email + senha):
--   ana@convivo.dev    / Convivo123!  (indicou Bruno e Carla, saldo R$8,60)
--   bruno@convivo.dev  / Convivo123!  (indicado por Ana)
--   carla@convivo.dev  / Convivo123!  (indicada por Ana)
-- ============================================================

-- ============================================================
-- ATENÇÃO: as seções 1, 1b e 2 acima já foram aplicadas nesse banco numa
-- rodada anterior (confirmado por diagnóstico) — rodar de novo vai dar erro
-- de "already exists"/"duplicate key". A partir daqui é NOVO, ainda não
-- aplicado:
--
-- 1c) Migration de Comissão de Vendedor
-- Equivalente a prisma/migrations/20260820040000_add_vendedor_commission
-- Remove a coluna morta "vendedorAttributed" (nunca foi usada em código
-- nenhum) e adiciona o vínculo cliente→vendedor de verdade, que coexiste
-- com a indicação entre amigos — ver creditVendedorCommission em
-- src/lib/orders/orderCore.ts.
-- ============================================================
ALTER TABLE "User" DROP COLUMN "vendedorAttributed";

ALTER TABLE "User" ADD COLUMN "isVendedor" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "vendedorId" TEXT;

ALTER TABLE "User"
  ADD CONSTRAINT "User_vendedorId_fkey"
  FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "WalletEntrySource" ADD VALUE 'VENDEDOR_PURCHASE_COMMISSION';

-- IMPORTANTE: mesma observação de antes — se o editor abrir uma transação
-- por "Run" e reclamar de "unsafe use of new value" no INSERT abaixo, rode
-- o ALTER TYPE isolado primeiro (ele não é usado nessa mesma seção antes
-- do bloco 2c, então normalmente não há problema).

-- ============================================================
-- 2b) Seed: conta de vendedor (Pedro), vinculado a Bruno — que já tinha
-- Ana como amigo indicador. Demonstra os dois vínculos coexistindo no
-- mesmo cliente (Bruno), cada um com sua taxa de comissão.
-- Senha: Convivo123!
-- ============================================================
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "isVendedor",
  "referralCode", "createdAt", "conditions", "allergies"
) VALUES (
  '6d0796ce-cfb9-45c4-b913-7a63cb50862e', 'Pedro Vendedor', 'pedro.vendedor@convivo.dev',
  '$2b$10$9LxPIO2LhpvGVNPSUMMCF.dueCjXJN8TPyRb1PBGZeRO99CKKakRS', true,
  'VD8LKM3', now(), ARRAY[]::TEXT[], ARRAY[]::TEXT[]
);

-- Vincula Bruno ao vendedor Pedro — Bruno mantém referredById = Ana (amigo)
-- E ganha vendedorId = Pedro ao mesmo tempo.
UPDATE "User" SET "vendedorId" = '6d0796ce-cfb9-45c4-b913-7a63cb50862e'
WHERE "id" = 'a34da414-effd-4132-a98d-f301a054c949';

-- Comissão de 5% já creditada pra Pedro por uma compra passada de Bruno
-- (mesmo formato usado por creditVendedorCommission em
-- src/lib/orders/orderCore.ts).
INSERT INTO "WalletEntry" ("id", "userId", "amountCents", "source", "description", "createdAt")
VALUES (
  gen_random_uuid()::text, '6d0796ce-cfb9-45c4-b913-7a63cb50862e', 800,
  'VENDEDOR_PURCHASE_COMMISSION', 'Comissão de 5% pela compra de Bruno Lima', now()
);

-- ============================================================
-- Conta de vendedor resultante:
--   pedro.vendedor@convivo.dev / Convivo123!
--   (vinculado a Bruno, que também tem Ana como amigo indicador — os dois
--   vínculos coexistem e geram comissão independente por compra do Bruno)
-- ============================================================

-- ============================================================
-- 1d) Migration de Resgate de Saldo no Checkout
-- Equivalente a prisma/migrations/20260820050000_add_wallet_redemption
-- Deixa o cliente usar o saldo da carteira (indicação/vendedor/fidelidade)
-- como desconto no checkout — ver src/lib/wallet.ts e as mudanças em
-- createOrderForItems/approveOrder em src/lib/orders/orderCore.ts.
-- ============================================================
ALTER TABLE "Order" ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "walletDiscountCents" INTEGER NOT NULL DEFAULT 0;

-- Backfill: pedidos existentes nunca tiveram desconto, então subtotalCents
-- == totalCents pra todo o histórico.
UPDATE "Order" SET "subtotalCents" = "totalCents";

ALTER TYPE "WalletEntrySource" ADD VALUE 'WALLET_REDEMPTION';

-- ============================================================
-- 1e) Migration de Metas (Goals)
-- Equivalente a prisma/migrations/20260820060000_add_goals
-- Metas com prazo declaradas pelo usuário + dicas ao longo do tempo — ver
-- src/lib/goals/goalCore.ts, src/lib/goals/goalTips.ts e a nova função
-- dispatchDueGoalTips em src/lib/reminders/dispatchCore.ts.
-- ============================================================
CREATE TYPE "GoalMetric" AS ENUM ('PESO', 'PRESSAO', 'ROTINA');

CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metric" "GoalMetric" NOT NULL,
    "title" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "baselineValue" DOUBLE PRECISION,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "checklistItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalTipDispatch" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "tipIndex" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalTipDispatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_endDate_idx" ON "Goal"("userId", "endDate");

CREATE UNIQUE INDEX "GoalTipDispatch_goalId_tipIndex_key" ON "GoalTipDispatch"("goalId", "tipIndex");

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "CareChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GoalTipDispatch" ADD CONSTRAINT "GoalTipDispatch_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 1f) Migration de Métodos de Pagamento
-- Equivalente a prisma/migrations/20260820070000_add_payment_methods
-- Mercado Pago online, cartão presencial e dinheiro (com troco) — ver
-- src/lib/orders/mercadopago.ts e as mudanças em createOrderForItems/
-- approveOrder/rejectOrder em src/lib/orders/orderCore.ts.
-- ============================================================
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE_MP', 'CARTAO_PRESENCIAL', 'DINHEIRO');

ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CARTAO_PRESENCIAL';
ALTER TABLE "Order" ADD COLUMN "cashTenderedCents" INTEGER;
ALTER TABLE "Order" ADD COLUMN "mpPreferenceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpError" TEXT;

CREATE INDEX "Order_mpPreferenceId_idx" ON "Order"("mpPreferenceId");

-- ============================================================
-- 1g) Migration do Catálogo ao vivo (espelho write-through)
-- Equivalente a prisma/migrations/20260820080000_live_catalog_mirror
-- Product deixa de ser tabela curada: nome não é mais único (vem do
-- banco externo da farmácia), description e category ficam opcionais
-- (sem coluna equivalente/taxonomia própria na origem) — ver
-- src/lib/catalog/catalogDb.ts e src/lib/catalog/catalogMirror.ts.
-- ============================================================
DROP INDEX "Product_name_key";
ALTER TABLE "Product" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "Product" ALTER COLUMN "category" DROP NOT NULL;
DROP TYPE "ProductCategory";
