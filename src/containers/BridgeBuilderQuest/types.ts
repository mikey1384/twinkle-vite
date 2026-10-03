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
  // client-only: the current step is waiting on someone else (staff, parents)
  waiting?: boolean;
}

export interface QuestProgress {
  students: number;
  branches: number;
  branchesToVerify: { userId: number; username: string; branch: string }[];
  branchNames: string[];
  // the tier these members would earn if all showed up, and how to climb
  tier: 'bronze' | 'silver' | 'gold' | null;
  tierHint: string;
  // the members are ready; only the owner's approval is missing
  crewAwaitingApproval: boolean;
  grownUpAwaitingApproval: boolean;
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
  // bronze | silver | gold once the meetup is approved, '' before
  tier?: string;
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
  // official Twinkle branch (the crew waits for it); status = what staff made of the name
  branchVerified: boolean;
  branchStatus: 'official' | 'pending' | 'rejected' | 'none';
  parentOk: boolean;
  // the parent's latest answer was no (the child sits this meetup out)
  parentSaidNo?: boolean;
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
  // the crew's group chat (members and admins only)
  chat: { channelId: number; pathId: number } | null;
  // admins only: every parent's answer and contact (never shown to members)
  // parents' suggested changes to the plan (by the child's username)
  parentSuggestions?: { childUsername: string; body: string; createdAt: number }[];
  parentContacts?: {
    userId: number;
    childUsername: string;
    status: string;
    email: string;
    verifiedGuardian: boolean;
    sharesWithParents: boolean;
    question: string;
    staffReply: string;
    staffRepliedAt: number;
    // the parent said yes and will be the grown-up there themselves
    // placeholder offers ticked with a yes (who takes each role is decided later)
    willingGuardian: boolean;
    offersPlace: boolean;
    decidedAt: number;
  }[];
  viewer: {
    isMember: boolean;
    isFounder: boolean;
    isAdmin: boolean;
    detailsLocked: boolean;
    frozen: boolean;
    // this member's own ask-my-parent state (never an address)
    parentConsent?: import('./Parent/AskParentPanel').ParentConsentState | null;
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
  // staff only: every parent's answer and contact for this crew
  parents?: NonNullable<CrewView['parentContacts']>;
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
  // admins: every live crew and where it is stuck
  allCrews?: AdminCrewRow[] | null;
}

export interface AdminCrewRow {
  crewId: number;
  displayName: string;
  status: string;
  currentStep: QuestStepKey | null;
  blocking: string;
  members: { userId: number; username: string; branch: string }[];
  branchesToVerify: { userId: number; username: string; branch: string }[];
  parents: { asked: number; approved: number };
  updatedAt: number;
  planSubmittedAt: number;
}
