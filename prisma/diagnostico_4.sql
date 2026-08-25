SELECT enumlabel FROM pg_enum
WHERE enumtypid = '"GoalMetric"'::regtype
ORDER BY enumsortorder;

SELECT table_name FROM information_schema.tables
WHERE table_name IN ('Goal', 'GoalTipDispatch')
ORDER BY table_name;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'Goal'
ORDER BY ordinal_position;
