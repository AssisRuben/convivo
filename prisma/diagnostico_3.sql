SELECT column_name FROM information_schema.columns
WHERE table_name = 'CareChecklistItem' AND column_name = 'medicationTrackingId';

SELECT "userId", "amountCents", "source", "description" FROM "WalletEntry"
WHERE "userId" = '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2';

SELECT "userId", "type", "goalType", "milestoneValue", "stage" FROM "TimelineEvent"
WHERE "userId" = '8958cbdb-a2cf-4038-b13a-8213e6fdcbb2';
