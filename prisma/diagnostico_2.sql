-- Diagnóstico: o que já existe no banco (cartão fidelidade + medicamentos)

SELECT enumlabel FROM pg_enum
WHERE enumtypid = '"WalletEntrySource"'::regtype
ORDER BY enumsortorder;

SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'LoyaltyStampCycle', 'MedicationTracking', 'MedicationRepurchaseAlert', 'ExpoPushToken'
)
ORDER BY table_name;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'CareChecklistItem' AND column_name = 'medicationTrackingId';

SELECT EXISTS (
  SELECT 1 FROM "User" WHERE email IN ('ana@convivo.dev', 'bruno@convivo.dev', 'carla@convivo.dev')
) AS seed_accounts_exist;

SELECT email, "referredById" FROM "User"
WHERE email IN ('ana@convivo.dev', 'bruno@convivo.dev', 'carla@convivo.dev');
