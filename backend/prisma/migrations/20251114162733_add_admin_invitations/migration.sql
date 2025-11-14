-- CreateTable
CREATE TABLE "invited_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "invited_users_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invited_users" ADD CONSTRAINT "invited_users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
