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

export type CrewStage =
  | 'forming'
  | 'parents'
  | 'planning'
  | 'meeting'
  | 'filmed'
  | 'done'
  | 'closed';

export interface CrewProfile {
  name: string;
  displayName: string;
  about: string;
  cover: string;
  isOpen: boolean;
}

export interface CrewMember {
  userId: number;
  username: string;
  profilePicUrl?: string;
  branch: string;
  parentOk: boolean;
  isFounder: boolean;
  attended: boolean;
}

export interface MeetupSlot {
  date: string;
  start: string;
  end: string;
}

// Visible to the crew and staff only, never on public views.
export interface CrewVenue {
  status: 'none' | 'offered' | 'unavailable' | 'set' | 'cancelled';
  branch: string;
  room: string;
  slots: MeetupSlot[];
  confirmedSlot: MeetupSlot | null;
}

export interface CrewView extends CrewProfile {
  stage: CrewStage;
  venue: CrewVenue;
  planApprovedBy: { userId: number; username: string } | null;
  invites: { inviteId: number; userId: number; username: string; createdAt: number }[];
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

export interface DirectoryCrew extends CrewProfile {
  crewId: number;
  status: string;
  stage: CrewStage;
  hint: string;
  students: number;
  branches: number;
  branchNames: string[];
  founderUsername: string;
  members: {
    userId: number;
    username: string;
    profilePicUrl: string;
    branch: string;
    isFounder: boolean;
  }[];
  createdAt: number;
  updatedAt: number;
  completedAt: number;
  isMine: boolean;
  joinable: boolean;
  inviteId: number;
}

export interface CrewDirectoryData {
  myBranch: string;
  hasActiveCrew: boolean;
  crews: DirectoryCrew[];
  hall: DirectoryCrew[];
}

export interface CrewInvitation extends CrewProfile {
  inviteId: number;
  crewId: number;
  inviterUsername: string;
  branchNames: string[];
  students: number;
  canJoin: boolean;
  closedReason: string;
  createdAt: number;
}

export interface CrewNotice {
  crewId: number;
  kind: 'removed' | 'disbanded';
  crewName: string;
}

export interface PublicCrewPage {
  crew: DirectoryCrew & {
    steps: QuestStep[];
    joinClosedReason: string;
  };
  myBranch: string;
  canSeePrivate: boolean;
}

export interface MyMeetup {
  crewId: number;
  displayName: string;
  cover: string;
  completedAt: number;
  attended: boolean;
}

export type CoordinatorStatus =
  | 'needs_scheduling'
  | 'scheduled'
  | 'filmed'
  | 'done'
  | 'on_hold';

export interface StaffUser {
  userId: number;
  username: string;
  realName: string;
}

export interface StaffApplication extends CrewProfile {
  crewId: number;
  status: string;
  stage: CrewStage;
  coordinatorStatus: CoordinatorStatus;
  branchNames: string[];
  members: {
    userId: number;
    username: string;
    realName: string;
    profilePicUrl?: string;
    branch: string;
    parentOk: boolean;
    isFounder: boolean;
    attended: boolean;
  }[];
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
  decidedBy: StaffUser | null;
  venue: CrewVenue;
  venueSetBy: StaffUser | null;
  video: { status: ReviewStatus; submittedAt: number };
  coordinatorEmailedAt: number;
  completedAt: number;
  updatedAt: number;
}

export interface StaffViewer {
  userId: number;
  username: string;
  realName?: string;
  profilePicUrl?: string;
  isAdmin: boolean;
  isReviewer: boolean;
  isCoordinator: boolean;
  canReviewPlans: boolean;
  canCoordinate: boolean;
  canAdminister: boolean;
  preview: boolean;
}

export interface StaffSummary {
  canReviewPlans: boolean;
  canCoordinate: boolean;
  canAdminister: boolean;
  plansWaiting: number;
  needsScheduling: number;
  meetupsThisWeek?: number;
  metThisMonth?: number;
}

export interface StaffMemberOption extends StaffUser {
  role: 'reviewer' | 'coordinator';
}

export interface StaffPageBase {
  viewer: StaffViewer;
  viewAsOptions: StaffMemberOption[] | null;
  summary: StaffSummary;
  achievementTitle: string;
}

export interface DeskData extends StaffPageBase {
  coordinator?: StaffUser | null;
  queue: StaffApplication[];
  decided: StaffApplication[];
  videosWaiting: StaffApplication[] | null;
}

export interface CoordinatorData extends StaffPageBase {
  applications: StaffApplication[];
  counts: Record<CoordinatorStatus, number>;
}

export interface StaffEvent {
  id: number;
  kind: string;
  actorId: number;
  actorUsername: string;
  detail: any;
  createdAt: number;
}

export interface StaffApplicationData {
  application: StaffApplication;
  events: StaffEvent[];
  notes: { id: number; authorId: number; username: string; note: string; createdAt: number }[];
  headmaster: StaffUser | null;
  viewer: StaffViewer;
}

export interface MeetupQuestData {
  myMeetups?: MyMeetup[];
  directory: CrewDirectoryData;
  invites: CrewInvitation[];
  notices: CrewNotice[];
  achievementTitle: string;
  myCrew: CrewView | null;
  hasActiveCrew: boolean;
  requestedCrew: CrewView | null;
  board: BoardCrew[];
  reviewQueue: ReviewQueueItem[] | null;
}
