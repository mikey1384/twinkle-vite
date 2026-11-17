// The topic brain (API helpers/topicBrain.ts): what Zero or Ciel keep in mind
// for one of the member's own chat topics: Custom Instructions, Notes for
// next time and kept files. Zero and Ciel only propose changes; the member's
// yes on the card saves them. Everything shown comes from the server.

export interface TopicBrainFile {
  id: number;
  fileName: string;
  kind: string;
  charCount: number;
  createdAt: number;
}

export interface TopicBrain {
  channelId: number;
  topicId: number;
  topicTitle: string;
  assistantName: 'Zero' | 'Ciel';
  instructions: string;
  notes: string;
  revision: number;
  updatedAt: number;
  files: TopicBrainFile[];
  versionCount: number;
  // the Custom Instructions are shared as an AI Prompt (older APIs omit it)
  shared?: boolean;
}

export type TopicBrainSource =
  | 'member'
  | 'assistant'
  | 'import'
  | 'restore'
  | 'baseline';

export interface TopicBrainVersionSummary {
  id: number;
  revision: number;
  source: TopicBrainSource;
  assistantName: 'Zero' | 'Ciel' | null;
  changedSection: 'instructions' | 'notes' | 'both';
  summary: string;
  instructionsChars: number;
  notesChars: number;
  createdAt: number;
}

export interface TopicBrainVersion {
  id: number;
  revision: number;
  source: TopicBrainSource;
  assistantName: 'Zero' | 'Ciel' | null;
  summary: string;
  instructions: string;
  notes: string;
  createdAt: number;
}

// notes / instructions: new words for that section. file: keep a document
// the member sent in the topic chat (or replace a kept copy with it).
export type TopicBrainProposalSection = 'instructions' | 'notes' | 'file';

export interface TopicBrainProposal {
  id: number;
  channelId: number;
  topicId: number;
  assistantName: 'Zero' | 'Ciel';
  section: TopicBrainProposalSection;
  summary: string;
  status: 'pending' | 'applied' | 'declined' | 'stale';
  before: string;
  after: string;
  outdated: boolean;
  // an instructions change on a topic shared as an AI Prompt
  updatesSharedPrompt?: boolean;
  // the document sent in the chat these words come from (older APIs omit it)
  fromFile?: { messageId: number; fileName: string; unavailable?: boolean } | null;
  // section 'file': keep it as a new file, or replace a kept copy
  file?: {
    action: 'keep' | 'replace';
    replacesFileName: string;
    // the message with the document was deleted
    unavailable: boolean;
  } | null;
}

// On a Zero/Ciel approval card: which proposal the card is about.
export interface TopicBrainCardPreview {
  kind: 'topic_brain';
  proposalId: number;
  channelId: number;
  topicId: number;
  section: TopicBrainProposalSection;
}

export function isTopicBrainCardPreview(
  value: unknown
): value is TopicBrainCardPreview {
  const preview = value as TopicBrainCardPreview;
  return (
    !!preview &&
    preview.kind === 'topic_brain' &&
    Number(preview.proposalId) > 0 &&
    Number(preview.channelId) > 0 &&
    Number(preview.topicId) > 0
  );
}

// Must match the API (helpers/topicBrain.ts). Never shown until one is hit.
export const TOPIC_BRAIN_NOTES_MAX = 8000;
export const TOPIC_BRAIN_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const TOPIC_BRAIN_FILE_ACCEPT =
  '.md,.markdown,.txt,.pdf,.docx,.csv,.json,.html,.htm,text/plain,text/markdown,application/pdf';

export function describeTopicBrainSource(
  version: Pick<TopicBrainVersionSummary, 'source' | 'assistantName'>
) {
  if (version.source === 'assistant') return version.assistantName || 'Zero/Ciel';
  if (version.source === 'import') return 'From a file';
  if (version.source === 'restore') return 'Restored';
  if (version.source === 'baseline') return 'Earlier';
  return 'You';
}

export interface TopicBrainDiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
}

// Past this many line pairs a full comparison is not worth the work: the
// changed middle is shown as all removed, then all added.
const DIFF_MAX_CELLS = 250_000;

// Which lines were added and removed, in reading order. Lines both texts
// start and end with are matched first (an added note at the end costs
// nothing), then a longest-common-subsequence over what is left.
export function diffTopicBrainLines(
  before: string,
  after: string
): TopicBrainDiffLine[] {
  const a = before ? before.split('\n') : [];
  const b = after ? after.split('\n') : [];
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start++;
  }
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const lines: TopicBrainDiffLine[] = a
    .slice(0, start)
    .map((text) => ({ type: 'same' as const, text }));
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  if ((midA.length + 1) * (midB.length + 1) > DIFF_MAX_CELLS) {
    for (const text of midA) lines.push({ type: 'removed', text });
    for (const text of midB) lines.push({ type: 'added', text });
  } else {
    const cols = midB.length + 1;
    const table = new Uint16Array((midA.length + 1) * cols);
    for (let i = midA.length - 1; i >= 0; i--) {
      for (let j = midB.length - 1; j >= 0; j--) {
        table[i * cols + j] =
          midA[i] === midB[j]
            ? table[(i + 1) * cols + j + 1] + 1
            : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < midA.length && j < midB.length) {
      if (midA[i] === midB[j]) {
        lines.push({ type: 'same', text: midA[i] });
        i++;
        j++;
      } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
        lines.push({ type: 'removed', text: midA[i++] });
      } else {
        lines.push({ type: 'added', text: midB[j++] });
      }
    }
    while (i < midA.length) lines.push({ type: 'removed', text: midA[i++] });
    while (j < midB.length) lines.push({ type: 'added', text: midB[j++] });
  }
  for (const text of a.slice(endA)) lines.push({ type: 'same', text });
  return lines;
}

export type TopicBrainDiffRow =
  | TopicBrainDiffLine
  | { type: 'skipped'; count: number };

// Long stretches that stay the same fold into one "N lines stay the same"
// row, keeping a line of context next to each change, so the change itself
// is what the member sees. With no change at all, nothing folds.
export function foldTopicBrainDiff(
  lines: TopicBrainDiffLine[],
  context = 1
): TopicBrainDiffRow[] {
  if (!lines.some((line) => line.type !== 'same')) return lines;
  const rows: TopicBrainDiffRow[] = [];
  let index = 0;
  while (index < lines.length) {
    if (lines[index].type !== 'same') {
      rows.push(lines[index++]);
      continue;
    }
    let end = index;
    while (end < lines.length && lines[end].type === 'same') end++;
    const keepBefore = index === 0 ? 0 : context;
    const keepAfter = end === lines.length ? 0 : context;
    const hidden = end - index - keepBefore - keepAfter;
    if (hidden >= 2) {
      rows.push(...lines.slice(index, index + keepBefore));
      rows.push({ type: 'skipped', count: hidden });
      rows.push(...lines.slice(end - keepAfter, end));
    } else {
      rows.push(...lines.slice(index, end));
    }
    index = end;
  }
  return rows;
}

// A picked file as base64, for the API to read its words.
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

export function downloadTextFile(fileName: string, text: string) {
  const url = window.URL.createObjectURL(
    new Blob([text], { type: 'text/markdown;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
