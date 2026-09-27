-- CreateTable
CREATE TABLE "notifications_items" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "notifications_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_items_user_id_created_at_idx" ON "notifications_items"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_items_event_id_user_id_key" ON "notifications_items"("event_id", "user_id");
