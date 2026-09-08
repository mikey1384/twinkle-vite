// Stable storage keys: changing the artwork must never change saved reactions.
// Refresh pre-upgrade clients when deploying new keys; they lack safe fallbacks.
export const chatReactionOptions = [
  { key: 'thumb', label: 'Thumbs up', fallback: '👍' },
  { key: 'heart', label: 'Heart', fallback: '❤️' },
  { key: 'laughing', label: 'Laughing', fallback: '😂' },
  { key: 'surprised', label: 'Surprised', fallback: '😮' },
  { key: 'wave', label: 'Wave', fallback: '👋' },
  { key: 'crying', label: 'Crying', fallback: '😢' },
  { key: 'angry', label: 'Angry', fallback: '😠' },
  { key: 'fire', label: 'Fire', fallback: '🔥' },
  { key: 'eyes', label: 'Eyes', fallback: '👀' },
  { key: 'thinking', label: 'Thinking', fallback: '🤔' },
  { key: 'celebrate', label: 'Celebrate', fallback: '🎉' },
  { key: 'clap', label: 'Clap', fallback: '👏' },
  { key: 'thanks', label: 'Thanks', fallback: '🙏' }
] as const;

export type ChatReactionKey = (typeof chatReactionOptions)[number]['key'];

export function getChatReaction(reaction: string) {
  return chatReactionOptions.find(({ key }) => key === reaction);
}
