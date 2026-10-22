// Mirrors twinkle-api controllers/user/services/meetupQuest.ts (server-owned
// state; the page never computes steps or counts itself). Since 2026-10-17 a
// crew has two stages: forming, then meeting up (check-ins).
export type QuestStepKey = 'crew' | 'meet';
export type QuestStepState = 'done' | 'current' | 'locked';

export interface QuestStep {
  key: QuestStepKey;
  number: number;
  label: string;
  badge: string;
  state: QuestStepState;
  detail: string;
  // client-only: the current step is waiting on someone else
  waiting?: boolean;
}

export interface QuestProgress {
  students: number;
  branches: number;
  branchesToVerify: { userId: number; username: string; branch: string }[];
  // members staff asked who they are, until staff accept the answer
  infoChecks?: {
    userId: number;
    username: string;
    status: 'requested' | 'answered';
  }[];
  branchNames: string[];
  // the tier: earned from who checked in once met, else what the crew would
  // earn if everyone checked in; and how to climb
  tier: 'bronze' | 'silver' | 'gold' | null;
  tierHint: string;
  // 2+ Twinkle students joined
  crewReady: boolean;
  // when the crew first met up (0 = not yet)
  metAt: number;
  // members who checked in with the crew
  checkedIn: number;
  steps: QuestStep[];
  currentStep: QuestStepKey | null;
  blocking: string;
  badges: string[];
}

export type CrewStage = 'forming' | 'meeting' | 'met' | 'closed';

export interface CrewProfile {
  // bronze | silver | gold once the crew met up, '' before
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
  // Non-students have no verified branch; their explicit choice is not_student.
  branchVerified: boolean;
  branchStatus: 'official' | 'pending' | 'rejected' | 'none' | 'not_student';
  isFounder: boolean;
  // checked in with the crew at a meetup
  attended: boolean;
  // staff asked this member who they are (MemberInfoCheck.tsx); until staff
  // accept, they don't count toward the tier
  infoCheck?: 'requested' | 'answered' | null;
}

// Admins only: one "who are you" check and the member's answer (any crew).
export interface MemberCheckRecord {
  checkId: number;
  crewId: number;
  userId: number;
  username: string;
  status: 'requested' | 'answered' | 'accepted' | 'withdrawn' | 'returned';
  askNote: string;
  requestedBy: string;
  requestedAt: number;
  teacherName: string;
  className: string;
  answerBranch?: string;
  answerRevision?: number;
  classBranch?: string;
  canApproveClass?: boolean;
  classApprovalBlocker?: string;
  officialClass?: { id: number; name: string } | null;
  relationship: string;
  answeredAt: number;
  reviewedBy: string;
  reviewedAt: number;
  staffNote: string;
}

// Admins only: staff set this member's branch (MemberBranchSetter.tsx), with
// their private note. Never on a member's view.
export interface MemberBranchChange {
  id: number;
  userId: number;
  username: string;
  oldBranch: string;
  newBranch: string;
  note: string;
  actorUsername: string;
  createdAt: number;
}

export interface CrewView extends CrewProfile {
  meetupReview?: '' | 'pending' | 'approved' | 'rejected';
  stage: CrewStage;
  invites: {
    inviteId: number;
    userId: number;
    username: string;
    createdAt: number;
  }[];
  crewId: number;
  founderId: number;
  status: 'active' | 'completed' | 'disbanded';
  members: CrewMember[];
  // when the crew first met up (0 = not yet)
  completedAt: number;
  progress: QuestProgress;
  // the crew's group chat (members and admins only)
  chat: { channelId: number; pathId: number } | null;
  // admins only: every "who are you" check on these members, in any crew
  memberChecks?: MemberCheckRecord[];
  // admins only: staff's branch corrections on this crew, newest first
  branchChanges?: MemberBranchChange[];
  viewer: {
    isMember: boolean;
    isFounder: boolean;
    isAdmin: boolean;
    canApproveClasses?: boolean;
    frozen: boolean;
    // what staff asked this member, and their own answer (only theirs)
    infoCheck?: {
      branch?: string;
      officialClasses?: { id: number; name: string }[];
      status: 'requested' | 'answered';
      askNote: string;
      requestedAt: number;
      answer: { teacherName: string; className: string; relationship: string };
      answeredAt: number;
    } | null;
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
  waitingFor: '' | 'memberInfo' | 'meetup';
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
  // ('replaced' was the retired parent-step replacement; old rows still read)
  kind: 'removed' | 'replaced' | 'disbanded';
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
  infoChecks?: { userId: number; username: string; status: string }[];
  metAt: number;
  tier: 'bronze' | 'silver' | 'gold' | null;
  updatedAt: number;
}

// Bridge Builder check-ins (twinkle-api services/meetupCheckins.ts)
export type CheckinPersonState =
  | 'counted'
  | 'waiting_birthdate'
  | 'getting_started'
  | 'not_counted';

export interface CheckinPerson {
  userId: number;
  username: string;
  profilePicUrl: string | null;
  way: 'checkin' | 'invite';
  at: number;
  state: CheckinPersonState;
  waitingOn?: 'me' | 'them' | 'both';
  // the check-in showed two phones in one place (same network, same academy
  // branch, or the sound check); never says which
  together?: boolean;
}

export interface CheckinProgress {
  target: number;
  counted: number;
  people: CheckinPerson[];
  witnessed: boolean;
  // the grown-up was a teacher or the guardian on file (else the unlock waits
  // for the administrator: a parent address the child typed)
  witnessVerified?: boolean;
  witnessPending: boolean;
  needsMyBirthdate: boolean;
  myAge: 'kid' | 'adult' | 'unknown';
  canWitness: boolean;
  bar: { days: number; xp: number };
  unlocked: boolean;
  // Every qualifying physical meetup waits for the owner's decision.
  review: boolean;
  reviewRejected?: boolean;
  parentInvite?: {
    state:
      | 'held'
      | 'sent'
      | 'failed'
      | 'discarded'
      | 'expired'
      | 'active'
      | 'ended'
      | 'unknown';
    toMasked: string;
    expiresAt: number;
    sessionEndsAt: number;
    checkedIn: boolean;
    attendees: number;
  } | null;
  // met people, but no check-in showed one place yet: offer the "show you're
  // together" guide (TogetherGuide.tsx)
  needsTogether?: boolean;
}

export type CheckinScanResult =
  | { state: 'scan_back'; partnerId: number }
  | {
      state: 'done';
      partnerId: number;
      checkinId: number;
      isNew: boolean;
      together?: boolean;
      // a pair that was remote just showed they were together
      upgraded?: boolean;
    }
  | { state: 'witnessed'; sessionId: number; inPlace?: boolean }
  | { state: 'refused'; partnerId: number; line: string };
