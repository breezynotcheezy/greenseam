-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "emoji" TEXT
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "canonical" TEXT NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlateAppearance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "bbType" TEXT,
    "gameDate" TEXT NOT NULL,
    "inning" INTEGER,
    "count" TEXT,
    "pitchCount" INTEGER,
    "inPlay" BOOLEAN NOT NULL,
    "exitVelocity" REAL,
    "launchAngle" REAL,
    "distance" REAL,
    "location" TEXT,
    "contactType" TEXT,
    "pitchType" TEXT,
    "rbi" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "isHomeRun" BOOLEAN NOT NULL,
    "isStrikeout" BOOLEAN NOT NULL,
    "isWalk" BOOLEAN NOT NULL,
    "isHBP" BOOLEAN NOT NULL,
    "isSacFly" BOOLEAN NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "leverageIndex" REAL,
    "clutchSituation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlateAppearance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_canonical_key" ON "Player"("canonical");
