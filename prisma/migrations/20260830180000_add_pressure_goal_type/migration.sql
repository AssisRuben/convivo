-- Escada de conquista de pressão (ver GOAL_LADDERS.PRESSAO em
-- lib/timeline/achievements.ts), mesmo mecanismo já usado por
-- PESO/ROTINA/INDICACAO — precisa do próprio valor no enum porque
-- TimelineEvent.goalType é tipado por ele.
ALTER TYPE "GoalType" ADD VALUE 'PRESSAO';
