-- Confirma que o CPF cadastrado é mesmo do dono da conta, batendo contra o
-- telefone já cadastrado na Trier pra esse CPF — antes disso, qualquer
-- conta logada podia digitar o CPF de outra pessoa e ver o histórico de
-- compra real dela (dado de saúde). cpfVerificationAttempts/LockedUntil
-- freiam tentativa de força bruta contra o telefone de um CPF específico.
ALTER TABLE "User" ADD COLUMN "cpfVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "cpfVerificationAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "cpfVerificationLockedUntil" TIMESTAMP(3);
