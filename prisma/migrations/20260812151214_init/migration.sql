-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('MUBTADI', 'MUTAWASSIT', 'IHTIRAFI');

-- CreateEnum
CREATE TYPE "BloomLevel" AS ENUM ('BLOOM1', 'BLOOM2', 'BLOOM3', 'BLOOM4', 'BLOOM5', 'BLOOM6');

-- CreateEnum
CREATE TYPE "DistractorType" AS ENUM ('M', 'P', 'T', 'W');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemBank" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceFile" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "blueprintJson" JSONB,
    "qaLogJson" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "itemBankId" TEXT NOT NULL,
    "externalCode" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'AR',
    "knowledgePath" TEXT NOT NULL,
    "frameworkRef" TEXT,
    "bloomLevel" "BloomLevel" NOT NULL,
    "bloomLabel" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "difficultyLabel" TEXT NOT NULL,
    "targetPValue" DOUBLE PRECISION,
    "targetDiscrimination" DOUBLE PRECISION,
    "estimatedTimeSeconds" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "sourceReference" TEXT,
    "reviewerNotes" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Choice" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "justification" TEXT NOT NULL,
    "distractorType" "DistractorType",

    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "itemBankId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "maxPoints" INTEGER NOT NULL DEFAULT 0,
    "scorePercent" DOUBLE PRECISION,
    "level" INTEGER NOT NULL DEFAULT 1,
    "levelTitle" TEXT,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerLog" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "chosenChoiceId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpentMs" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantBadge" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "attemptId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ItemBank_code_key" ON "ItemBank"("code");

-- CreateIndex
CREATE INDEX "Question_itemBankId_order_idx" ON "Question"("itemBankId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Question_itemBankId_externalCode_key" ON "Question"("itemBankId", "externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Choice_questionId_label_key" ON "Choice"("questionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_identifier_key" ON "Participant"("identifier");

-- CreateIndex
CREATE INDEX "Attempt_participantId_idx" ON "Attempt"("participantId");

-- CreateIndex
CREATE INDEX "Attempt_itemBankId_idx" ON "Attempt"("itemBankId");

-- CreateIndex
CREATE INDEX "AnswerLog_questionId_idx" ON "AnswerLog"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerLog_attemptId_questionId_key" ON "AnswerLog"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantBadge_participantId_badgeId_attemptId_key" ON "ParticipantBadge"("participantId", "badgeId", "attemptId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_itemBankId_fkey" FOREIGN KEY ("itemBankId") REFERENCES "ItemBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_itemBankId_fkey" FOREIGN KEY ("itemBankId") REFERENCES "ItemBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerLog" ADD CONSTRAINT "AnswerLog_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerLog" ADD CONSTRAINT "AnswerLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerLog" ADD CONSTRAINT "AnswerLog_chosenChoiceId_fkey" FOREIGN KEY ("chosenChoiceId") REFERENCES "Choice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantBadge" ADD CONSTRAINT "ParticipantBadge_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantBadge" ADD CONSTRAINT "ParticipantBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantBadge" ADD CONSTRAINT "ParticipantBadge_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
