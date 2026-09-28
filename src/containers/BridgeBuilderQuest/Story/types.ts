// Mirrors twinkle-api controllers/user/services/meetupStory.ts. Server-owned
// state: the page never decides what is public; each item's `gate` comes from
// the API's consent check.

export type StoryStatus = 'draft' | 'submitted' | 'published';

export type MemberConsentState =
  | 'no_guardian'
  | 'not_asked'
  | 'pending'
  | 'expired'
  | 'approved'
  | 'declined'
  | 'withdrawn';

export interface StoryGate {
  publishable: boolean;
  reason: 'ok' | 'untagged' | 'waiting' | 'not_in_story';
  waitingOn: { userId: number; state: MemberConsentState | 'not_covered' | 'not_in_story' }[];
}

export interface StoryMediaItem {
  id: number;
  kind: 'photo' | 'clip';
  // public copies: a CloudFront key; previews: a 1-hour signed url
  key: string;
  posterKey: string;
  url: string;
  posterUrl: string;
  caption: string;
  width: number;
  height: number;
  durationSec: number;
  // previews only
  taggedUserIds?: number[];
  noFaces?: boolean;
  position?: number;
  gate?: StoryGate;
}

export interface StoryPerson {
  userId: number;
  username: string;
  profilePicUrl: string;
  branch: string;
  role: string;
}

export interface StoryViewData {
  storyId: number;
  crewId: number;
  isSample: boolean;
  sampleSlug: string;
  sampleNotice: string;
  status: StoryStatus;
  title: string;
  subtitle: string;
  activityKind: string;
  body: string;
  crewName: string;
  crewCover: string;
  dateLabel: string;
  place: string;
  branches: string[];
  grownUps: { label: string; role: string }[];
  people: StoryPerson[];
  publishedAt: number;
  announcementSubjectId: number;
  preview: boolean;
  cover: { key: string; url: string; alt: string } | null;
  photos: StoryMediaItem[];
  clips: StoryMediaItem[];
  viewer?: { isMember: boolean; isAdmin: boolean; canEdit: boolean };
  review?: {
    reviewNote: string;
    submittedAt?: number;
    consents?: { userId: number; state: MemberConsentState }[];
    nameWarnings?: string[];
    addedParentEmails?: { userId: number; masked: string; changes: number; updatedAt: number }[];
  } | null;
}

export interface StoryCardData {
  storyId: number;
  isSample: boolean;
  sampleSlug: string;
  title: string;
  subtitle: string;
  activityKind: string;
  coverKey: string;
  crewName: string;
  crewCover: string;
  dateLabel: string;
  branches: string[];
  people: { userId: number; username: string; profilePicUrl: string }[];
  peopleCount: number;
  publishedAt: number;
}

export interface StoryEditorPerson extends StoryPerson {
  consent: MemberConsentState;
  taggedIn: number;
  // who we'd email: a guardian on file, a parent email the member added for
  // this story, or nobody yet (masked, and only for the member and admins)
  parentContact: {
    source: 'guardian' | 'added' | 'none';
    masked: string;
    canSet: boolean;
  };
}

export interface StoryEditorData {
  crew: {
    crewId: number;
    status: string;
    displayName: string;
    cover: string;
    completed: boolean;
  };
  canStart: boolean;
  openReason: string;
  story: {
    storyId: number;
    status: StoryStatus;
    revision: number;
    title: string;
    subtitle: string;
    activityKind: string;
    body: string;
    memberRoles: Record<string, string>;
    coverMediaId: number | null;
    reviewNote: string;
    submittedAt: number;
    publishedAt: number;
    updatedAt: number;
  } | null;
  view?: StoryViewData;
  items?: StoryMediaItem[];
  people?: StoryEditorPerson[];
  nameWarnings?: string[];
  viewer?: { canEdit: boolean; isAdmin: boolean; submitProblem: string };
}

export interface StoriesOverview {
  samples: StoryCardData[];
  hall: StoryCardData[];
  mine: { storyId: number; crewId: number; status: StoryStatus; title: string }[];
  reviewQueue:
    | {
        storyId: number;
        crewId: number;
        crewName: string;
        title: string;
        submittedAt: number;
        people: string[];
        itemsPublic: number;
        itemsPrivate: number;
      }[]
    | null;
}

export interface ParentConsentView {
  status: 'pending' | 'approved' | 'declined' | 'withdrawn' | 'expired' | 'replaced';
  expiresAt: number;
  // the child typed this parent email in (no guardian on file)
  addedByChild?: boolean;
  language: 'ko' | 'en';
  child: { username: string; realName: string; profilePicUrl: string };
  story: {
    title: string;
    subtitle: string;
    activityKind: string;
    body: string;
    crewName: string;
    dateLabel: string;
    branches: string[];
    people: string[];
    status: StoryStatus;
  };
  items: {
    id: number;
    kind: 'photo' | 'clip';
    caption: string;
    width: number;
    height: number;
    durationSec: number;
    url: string;
    posterUrl: string;
    withOthers: string[];
  }[];
}
