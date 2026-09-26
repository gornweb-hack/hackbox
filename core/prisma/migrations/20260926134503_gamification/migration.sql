-- CreateTable
CREATE TABLE "gamification_runs" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "loyalty" INTEGER NOT NULL,
    "safety" INTEGER NOT NULL,
    "finished_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "gamification_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gamification_runs_run_id_key" ON "gamification_runs"("run_id");

-- CreateIndex
CREATE INDEX "gamification_runs_user_id_finished_at_idx" ON "gamification_runs"("user_id", "finished_at");
