export const VIBE_OPTIONS = [
  {
    id: 'default',
    title: 'Let Twinkle Pick',
    description: 'Let Twinkle pick a balanced question for tomorrow.'
  },
  {
    id: 'follow_up',
    title: 'Keep Going',
    description: "Continue today's reflection with a connected next question."
  },
  {
    id: 'go_deeper',
    title: 'Go Deeper',
    description: 'Stay on the same theme and think one level deeper.'
  },
  {
    id: 'open_new_door',
    title: 'New Angle',
    description: 'Try a fresh angle that still feels about you.'
  },
  {
    id: 'light',
    title: 'Light & Easy',
    description: 'Keep tomorrow easier, lighter, and less heavy.'
  },
  {
    id: 'opinion',
    title: 'My Take',
    description: 'Ask for your opinion and why you see it that way.'
  },
  {
    id: 'autobiography',
    title: 'My Story',
    description: 'Reflect on one chapter from your life story.'
  },
  {
    id: 'connection',
    title: 'People & Connection',
    description: 'Focus on friendships, relationships, and belonging.'
  },
  {
    id: 'growth',
    title: 'Level Up',
    description: 'Focus on learning, courage, and your next direction.'
  },
  {
    id: 'fictional',
    title: 'Hypothetical',
    description:
      'Guarantee a hypothetical question with no real personal details in the wording; overt fiction only when it helps the question work.'
  }
] as const;

export const FOCUS_OPTIONS = [
  {
    id: 'infer',
    title: 'Let Twinkle Pick',
    description: 'Let Twinkle infer your focus from your recent activity.'
  },
  {
    id: 'dating_partner_search',
    title: 'Crushes & Dating',
    description: 'Questions about crushes, dating, and partner hopes.'
  },
  {
    id: 'relationship_partnership',
    title: 'Relationship Vibes',
    description: 'Questions about your current relationship dynamics.'
  },
  {
    id: 'breakup_recovery',
    title: 'After a Breakup',
    description: 'Questions for healing and moving forward after a breakup.'
  },
  {
    id: 'family_parenting',
    title: 'Family Life',
    description: 'Questions about family roles, support, and responsibilities.'
  },
  {
    id: 'friendship_social_life',
    title: 'Friends & Social Life',
    description: 'Questions about friendships, social energy, and belonging.'
  },
  {
    id: 'job_search_career',
    title: 'School & Future Dreams',
    titleAdult: 'Career & Work Direction',
    description:
      'Questions about school path, future goals, and dream direction.',
    descriptionAdult:
      'Questions about career choices, work direction, and your next step.'
  },
  {
    id: 'exam_test_prep',
    title: 'Tests & Study',
    titleAdult: 'Exams & Certifications',
    description: 'Questions about studying, test pressure, and exam mindset.',
    descriptionAdult:
      'Questions about exam prep, certifications, and study pressure.'
  },
  {
    id: 'entrepreneurship',
    title: 'Projects & Big Ideas',
    description:
      'Questions about building projects, clubs, and idea-driven goals.',
    titleAdult: 'Projects & Entrepreneurship',
    descriptionAdult:
      'Questions about projects, side hustles, and entrepreneurship.'
  },
  {
    id: 'financial_stability',
    title: 'Money Habits & Goals',
    titleAdult: 'Financial Stability',
    description: 'Questions about saving, spending, and money confidence.',
    descriptionAdult:
      'Questions about financial stability, tradeoffs, and money pressure.'
  },
  {
    id: 'purpose_identity',
    title: 'Who Am I?',
    description: 'Questions about identity, meaning, and personal values.'
  },
  {
    id: 'confidence_self_trust',
    title: 'Confidence / Self-trust',
    description: 'Questions about trusting yourself and your decisions.'
  },
  {
    id: 'stress_burnout',
    title: 'Stress / Burnout',
    description: 'Questions about stress load, boundaries, and recovery.'
  },
  {
    id: 'grief_loss',
    title: 'Grief / Loss',
    description: 'Gentle questions for grief, loss, and emotional change.'
  },
  {
    id: 'health_energy',
    title: 'Health / Energy',
    description: 'Questions about sleep, physical wellbeing, and energy.'
  },
  {
    id: 'life_transitions',
    title: 'Life Transitions',
    description: 'Questions about big changes and adapting to new seasons.'
  },
  {
    id: 'faith_spirituality',
    title: 'Faith / Spirituality',
    description: 'Questions about beliefs, spirituality, and meaning.'
  }
] as const;

export type VibeOptionId = (typeof VIBE_OPTIONS)[number]['id'];
export type FocusOptionId = (typeof FOCUS_OPTIONS)[number]['id'];
export type FocusOption = (typeof FOCUS_OPTIONS)[number];

export function isVibeOptionId(
  value: string | null | undefined
): value is VibeOptionId {
  if (!value) return false;
  return VIBE_OPTIONS.some((option) => option.id === value);
}

export function isFocusOptionId(
  value: string | null | undefined
): value is FocusOptionId {
  if (!value) return false;
  return FOCUS_OPTIONS.some((option) => option.id === value);
}

export function getVibeLabel(category: string | null) {
  const normalized = category || 'default';
  const option = VIBE_OPTIONS.find((entry) => entry.id === normalized);
  return option ? option.title : 'Let Twinkle Pick';
}

export function getFocusOptionTitle(
  option: FocusOption,
  isAdultUser: boolean
): string {
  return isAdultUser && 'titleAdult' in option && option.titleAdult
    ? option.titleAdult
    : option.title;
}

export function getFocusOptionDescription(
  option: FocusOption,
  isAdultUser: boolean
): string {
  return isAdultUser &&
    'descriptionAdult' in option &&
    option.descriptionAdult
    ? option.descriptionAdult
    : option.description;
}

export function getFocusLabel(focus: string | null, isAdultUser: boolean) {
  const normalized = focus || 'infer';
  const option = FOCUS_OPTIONS.find((entry) => entry.id === normalized);
  return option ? getFocusOptionTitle(option, isAdultUser) : 'Let Twinkle Pick';
}
