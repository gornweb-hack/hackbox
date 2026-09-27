-- AlterTable
ALTER TABLE "gamification_runs" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "timed_decisions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeouts" INTEGER NOT NULL DEFAULT 0;
