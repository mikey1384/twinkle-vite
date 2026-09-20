// Stable storage keys: changing the artwork must never change saved reactions.
// The API's 2.2.12 client floor excludes old sprite-only clients; admitted older
// bundles render future keys safely until a refresh loads their new artwork.
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
  { key: 'thanks', label: 'Thanks', fallback: '🙏' },
  { key: 'happy', label: 'Happy', fallback: '🙂' },
  { key: 'unimpressed', label: 'Unimpressed', fallback: '😒' },
  { key: 'sad', label: 'Sad', fallback: '☹️' },
  { key: 'miserable', label: 'Miserable', fallback: '😣' },
  { key: 'panicking', label: 'Panicking', fallback: '😱' }
] as const;

export type ChatReactionKey = (typeof chatReactionOptions)[number]['key'];

export function getChatReaction(reaction: string) {
  return chatReactionOptions.find(({ key }) => key === reaction);
}
