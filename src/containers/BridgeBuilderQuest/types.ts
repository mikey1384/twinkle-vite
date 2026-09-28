// Mirrors twinkle-api controllers/user/services/meetupQuest.ts (server-owned
// state; the page never computes steps or counts itself).
export type QuestStepKey = 'crew' | 'grownUp' | 'plan' | 'film' | 'review';
export type QuestStepState = 'done' | 'current' | 'locked';
export type ReviewStatus = 'none' | 'pending' | 'approved' | 'sent_back';

export interface QuestStep {
  key: QuestStepKey;
  number: number;
  label: string;
  badge: string;
  state: QuestStepState;
  detail: string;
}

export interface QuestProgress {
  students: number;
  branches: number;
  branchNames: string[];
  parentsOk: number;
  adultNamed: boolean;
  crewReady: boolean;
  grownUpReady: boolean;
  steps: QuestStep[];
  currentStep: QuestStepKey | null;
  blocking: string;
  badges: string[];
}

export interface CrewMember {
  userId: number;
  username: string;
  branch: string;
  parentOk: boolean;
  isFounder: boolean;
  attended: boolean;
}

export interface CrewView {
  crewId: number;
  founderId: number;
  status: 'active' | 'completed' | 'disbanded';
  members: CrewMember[];
  adult: { kind: string; name: string };
  plan: {
    status: ReviewStatus;
    date: string;
    area: string;
    activity: string;
    note: string;
    submittedAt: number;
    reviewedAt: number;
  };
  video: {
    status: ReviewStatus;
    url: string;
    fileName: string;
    note: string;
    submittedAt: number;
    reviewedAt: number;
  };
  completedAt: number;
  progress: QuestProgress;
  viewer: {
    isMember: boolean;
    isFounder: boolean;
    isAdmin: boolean;
    detailsLocked: boolean;
    frozen: boolean;
    canSubmitPlan: boolean;
    canSubmitVideo: boolean;
  };
}

export interface BoardCrew {
  crewId: number;
  members: { username: string; branch: string }[];
  students: number;
  branches: number;
  crewReady: boolean;
  hint: string;
}

export interface ReviewQueueItem {
  crewId: number;
  status: string;
  waitingFor: '' | 'plan' | 'video';
  founderUsername: string;
  members: { userId: number; username: string; branch: string }[];
  blocking: string;
  updatedAt: number;
}

export interface MeetupQuestData {
  achievementTitle: string;
  myCrew: CrewView | null;
  hasActiveCrew: boolean;
  requestedCrew: CrewView | null;
  board: BoardCrew[];
  reviewQueue: ReviewQueueItem[] | null;
}
