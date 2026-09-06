-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REPARTITEUR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RefereeLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "rank" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Referee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "zone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "levelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Referee_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "RefereeLevel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitionLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LevelMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionLevelId" TEXT NOT NULL,
    "minRefereeLevelId" TEXT NOT NULL,
    CONSTRAINT "LevelMapping_competitionLevelId_fkey" FOREIGN KEY ("competitionLevelId") REFERENCES "CompetitionLevel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LevelMapping_minRefereeLevelId_fkey" FOREIGN KEY ("minRefereeLevelId") REFERENCES "RefereeLevel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 100,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "venue" TEXT,
    "refereesRequired" INTEGER NOT NULL DEFAULT 1,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "competitionLevelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_competitionLevelId_fkey" FOREIGN KEY ("competitionLevelId") REFERENCES "CompetitionLevel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Designation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Designation_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Designation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefereeLevel_label_key" ON "RefereeLevel"("label");

-- CreateIndex
CREATE UNIQUE INDEX "RefereeLevel_rank_key" ON "RefereeLevel"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionLevel_label_key" ON "CompetitionLevel"("label");

-- CreateIndex
CREATE UNIQUE INDEX "LevelMapping_competitionLevelId_key" ON "LevelMapping"("competitionLevelId");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_matchId_refereeId_key" ON "Designation"("matchId", "refereeId");
