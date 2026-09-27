-- CreateTable
CREATE TABLE "scenario_runs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "node_shown_at" TIMESTAMPTZ(3) NOT NULL,
    "loyalty" INTEGER NOT NULL,
    "safety" INTEGER NOT NULL,
    "outcome" TEXT,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(3),

    CONSTRAINT "scenario_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_decisions" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "node_id" TEXT NOT NULL,
    "choice_id" TEXT,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "review" TEXT NOT NULL,
    "loyalty_delta" INTEGER NOT NULL,
    "safety_delta" INTEGER NOT NULL,
    "decided_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scenario_runs_user_id_finished_at_idx" ON "scenario_runs"("user_id", "finished_at");

-- CreateIndex
CREATE INDEX "scenario_decisions_run_id_idx" ON "scenario_decisions"("run_id");

-- AddForeignKey
ALTER TABLE "scenario_decisions" ADD CONSTRAINT "scenario_decisions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "scenario_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
