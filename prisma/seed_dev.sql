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
-- 2) Seed de 3 contas: Ana indicou Bruno e Carla, e já acumulou comissão
-- de indicação (saldo/pontuação) das compras dos dois.
-- Senha das 3 contas: Convivo123!
-- ============================================================
INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "vendedorAttributed",
  "referralCode", "referredById", "createdAt",
  "conditions", "allergies"
) VALUES
  (
    '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2', 'Ana Souza', 'ana@convivo.dev',
    '$2b$10$9LxPIO2LhpvGVNPSUMMCF.dueCjXJN8TPyRb1PBGZeRO99CKKakRS', false,
    'AN4X9KL', NULL, now(),
    ARRAY[]::TEXT[], ARRAY[]::TEXT[]
  ),
  (
    'a34da414-effd-4132-a98d-f301a054c949', 'Bruno Lima', 'bruno@convivo.dev',
    '$2b$10$9LxPIO2LhpvGVNPSUMMCF.dueCjXJN8TPyRb1PBGZeRO99CKKakRS', false,
    'BR7GHPZ', '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2', now(),
    ARRAY[]::TEXT[], ARRAY[]::TEXT[]
  ),
  (
    '8cc9b394-7304-473e-a812-01c26ede91f1', 'Carla Nunes', 'carla@convivo.dev',
    '$2b$10$9LxPIO2LhpvGVNPSUMMCF.dueCjXJN8TPyRb1PBGZeRO99CKKakRS', false,
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
