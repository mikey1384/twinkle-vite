import { Color } from '~/constants/css';

export const STATUS_META = {
  thinking: {
    text: 'Thinking...',
    icon: 'lightbulb',
    color: Color.gray()
  },
  thinking_hard: {
    text: 'Thinking Hard...',
    icon: 'brain',
    color: Color.orange()
  },
  thinking_complete: {
    text: 'Thinking complete.',
    icon: 'check',
    color: Color.green()
  },
  retrieving_memory: {
    text: 'Remembering...',
    icon: 'history',
    color: Color.blue()
  },
  reading_file: {
    text: 'Reading files...',
    icon: 'file-text',
    color: Color.purple()
  },
  analyzing_code: {
    text: 'Analyzing code...',
    icon: 'code',
    color: Color.logoBlue()
  },
  searching_web: {
    text: 'Searching the web...',
    icon: 'search',
    color: Color.pink()
  },
  saving_file: {
    text: 'Saving file...',
    icon: 'download',
    color: Color.logoGreen()
  },
  reading: {
    text: 'Reading and thinking...',
    icon: 'magnifying-glass',
    color: Color.redOrange()
  },
  recalling: {
    text: 'Recalling memories...',
    icon: 'clock',
    color: Color.darkBlue()
  },
  default: { text: 'Thinking...', icon: 'lightbulb', color: Color.gray() }
} as const;

export type StatusKey = keyof typeof STATUS_META;

export function metaFor(status?: string) {
  return STATUS_META[(status ?? 'default') as StatusKey] ?? STATUS_META.default;
}
