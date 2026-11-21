// Bridge Builder meetup quest numbers the achievement card states (and the
// crew directory's "needs you" / joinable checks).
// Mirror: twinkle-api/constants/meetupQuest.ts (the crew sizes and tier bars,
// which the quest rules enforce) and FACE_TO_FACE_RECRUIT_TARGET in
// twinkle-api/helpers/user/index.ts. The repos are separate, so change both;
// test/meetupAchievementCard.test.ts compares them when both are checked out.
export const MEETUP_CREW_MIN_MEMBERS = 2;
export const MEETUP_SILVER_MIN_BRANCHES = 2;
export const MEETUP_GOLD_MIN_MEMBERS = 3;
export const MEETUP_GOLD_MIN_BRANCHES = 3;
export const MEETUP_CREW_MAX_MEMBERS = 8;
export const MEETUP_NON_STUDENT_BRANCH = 'Not a Twinkle student';
export const FACE_TO_FACE_RECRUIT_TARGET = 7;
// A person counts once they are a real member: this many different learning
// days and this much learning XP, within this many days of joining (an
// invite) or of the check-in. Mirror: BRIDGE_BUILDER_BAR_* in twinkle-api
// constants/meetupQuest.ts and BAR_DAYS_AFTER in meetupCheckinRules.ts.
export const BRIDGE_BUILDER_BAR_LEARNING_DAYS = 3;
export const BRIDGE_BUILDER_BAR_LEARNING_XP = 10_000;
export const BRIDGE_BUILDER_BAR_DAYS_AFTER = 14;
// The Dark Citadel private-room invite: minutes of play together while the
// friend is a guest (twinkle-api helpers/build/completion/worldCoplay.ts)
// before Twinkle offers them Join Twinkle
export const BRIDGE_BUILDER_INVITE_COPLAY_MINUTES = 10;
// Twinkle Minecraft World, where The Dark Citadel's private rooms are
export const BRIDGE_BUILDER_INVITE_APP_PATH = '/app/2610';
