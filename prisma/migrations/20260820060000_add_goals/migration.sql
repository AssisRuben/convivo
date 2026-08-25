-- Metas com prazo (Goal) e o rastreamento de dicas já enviadas
-- (GoalTipDispatch) — sistema novo e separado das escadas automáticas
-- (GoalType/TimelineEvent), não mexe nelas.
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
