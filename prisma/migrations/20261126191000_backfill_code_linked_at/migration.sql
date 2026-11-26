-- Data dos vínculos que existiam antes de codeLinkedAt. Tirada do marco
-- "1 amigo indicado" (TimelineEvent INDICACAO, valor 1) de quem é o
-- código, gravado na hora do primeiro vínculo. Os de teste (Ana Souza)
-- foram vinculados no próprio cadastro: marco = createdAt do cliente.

-- Anne Maiane Ferreira -> código do Assis Rubens (15/10 13:31 BRT)
UPDATE "User" SET "codeLinkedAt" = '2026-10-15 16:31:25.231'
WHERE id = 'cmuc1p1gg000w0kpbfqeu8i2q' AND "referredById" = 'cmswkq2er0004z8ufmvdzbru5' AND "codeLinkedAt" IS NULL;

-- Assis Rubens -> código da Anne Maiane Ferreira (15/10 13:32 BRT)
UPDATE "User" SET "codeLinkedAt" = '2026-10-15 16:32:20.771'
WHERE id = 'cmswkq2er0004z8ufmvdzbru5' AND "referredById" = 'cmuc1p1gg000w0kpbfqeu8i2q' AND "codeLinkedAt" IS NULL;

-- Demais vínculos antigos (contas de teste, vinculadas no cadastro)
UPDATE "User" SET "codeLinkedAt" = "createdAt"
WHERE "codeLinkedAt" IS NULL AND ("referredById" IS NOT NULL OR "vendedorId" IS NOT NULL);
