import {
  FOCUS_OPTIONS,
  VIBE_OPTIONS,
  type FocusOption
} from '../questionPreferences';

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
