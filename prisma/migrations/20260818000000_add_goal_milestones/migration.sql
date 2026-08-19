-- Conquistas em escada (peso perdido, dias seguidos de rotina) que fazem
-- o "bichinho" evoluir em "Minhas postagens".
ALTER TYPE "TimelineEventType" ADD VALUE 'ACHIEVEMENT_WEIGHT_MILESTONE';
ALTER TYPE "TimelineEventType" ADD VALUE 'ACHIEVEMENT_GLICEMIA';
ALTER TYPE "TimelineEventType" ADD VALUE 'ACHIEVEMENT_ROUTINE_STREAK';

CREATE TYPE "GoalType" AS ENUM ('PESO', 'ROTINA');

ALTER TABLE "TimelineEvent"
  ADD COLUMN "goalType" "GoalType",
  ADD COLUMN "milestoneValue" DOUBLE PRECISION,
  ADD COLUMN "stage" INTEGER;

CREATE UNIQUE INDEX "TimelineEvent_userId_goalType_milestoneValue_key"
  ON "TimelineEvent"("userId", "goalType", "milestoneValue");
