ALTER TABLE "backtest_annotations" ADD COLUMN "endPrice" numeric(14, 5);
ALTER TABLE "backtest_annotations" ADD COLUMN "startAt" timestamp with time zone;
ALTER TABLE "backtest_annotations" ADD COLUMN "endAt" timestamp with time zone;
