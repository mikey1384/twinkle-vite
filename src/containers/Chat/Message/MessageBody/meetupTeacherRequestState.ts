// The Bridge Builder teacher request card's states (MeetupTeacherRequest.tsx),
// kept pure so they can be tested without rendering.
export type MeetupTeacherRequestStatus =
  | 'open'
  | 'accepted'
  | 'declined'
  | 'replaced'
  | 'cancelled'
  | 'plan_changed'
  | 'released';

export type MeetupTeacherReleaseReason =
  | 'picked_someone_else'
  | 'plan_changed'
  | 'classroom'
  | 'home';

export interface MeetupTeacherRequestPayload {
  crewId?: number;
  crewName?: string;
  teacherUserId?: number;
  teacherUsername?: string;
  requesterUserId?: number;
  requesterUsername?: string;
  plan?: { date: string; time: string; area: string; activity: string } | null;
  crewPath?: string;
  status?: MeetupTeacherRequestStatus;
  createdAt?: number;
  answeredAt?: number;
  // declined after a yes ("I can't make it after all")
  afterYes?: boolean;
  // released: why the crew no longer needs them
  releasedFor?: MeetupTeacherReleaseReason;
  // a fresh card because the plan changed after they were asked
  reask?: boolean;
}

const RELEASED_BECAUSE: Record<MeetupTeacherReleaseReason, string> = {
  picked_someone_else: 'the crew picked another grown-up',
  plan_changed: 'the crew changed its plan',
  classroom: 'the crew is meeting in a Twinkle classroom',
  home: "the crew is meeting at a member's home"
};

// What each person reads under the card for a settled (or waiting) request.
export function teacherRequestStatusLine({
  status,
  isTeacher,
  teacherUsername,
  afterYes = false,
  releasedFor
}: {
  status: MeetupTeacherRequestStatus;
  isTeacher: boolean;
  teacherUsername: string;
  afterYes?: boolean;
  releasedFor?: MeetupTeacherReleaseReason | '';
}) {
  if (status === 'accepted') {
    return isTeacher
      ? "You said you're coming."
      : `${teacherUsername} said yes: they're coming.`;
  }
  if (status === 'declined') {
    if (afterYes) {
      return isTeacher
        ? "You said you can't make it after all."
        : `${teacherUsername} can't make it after all. Pick another grown-up on the crew page.`;
    }
    return isTeacher
      ? "You said this isn't you."
      : `${teacherUsername} can't come. Pick another grown-up on the crew page.`;
  }
  // a yes to an older plan: a fresh card with the new plan asks again (never
  // "no longer needed": they are still wanted)
  if (status === 'released' && releasedFor === 'plan_changed') {
    return isTeacher
      ? 'The plan changed. Please confirm the new date and place in the new request.'
      : `The plan changed. A new request with the new plan went to ${teacherUsername}.`;
  }
  if (status === 'released') {
    const because = RELEASED_BECAUSE[releasedFor || 'plan_changed'] || RELEASED_BECAUSE.plan_changed;
    return isTeacher
      ? `No longer needed: ${because}. Thank you for saying yes!`
      : `No longer needed: ${because}.`;
  }
  if (status === 'plan_changed') {
    return 'The plan changed, so a new request with the new plan replaces this one.';
  }
  if (status === 'replaced') return 'The crew picked someone else.';
  if (status === 'cancelled') return "The crew's plan changed, so this request is closed.";
  return isTeacher ? '' : `Waiting for ${teacherUsername} to answer.`;
}
