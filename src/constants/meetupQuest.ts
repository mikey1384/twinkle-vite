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
