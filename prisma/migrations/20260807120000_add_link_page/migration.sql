-- CreateTable
CREATE TABLE "LinkPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "links" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkPage_userId_key" ON "LinkPage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkPage_handle_key" ON "LinkPage"("handle");

-- CreateIndex
CREATE INDEX "LinkPage_handle_idx" ON "LinkPage"("handle");

-- AddForeignKey
ALTER TABLE "LinkPage" ADD CONSTRAINT "LinkPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
