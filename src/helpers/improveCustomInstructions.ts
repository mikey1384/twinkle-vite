export interface ImprovedCustomInstructions {
  purpose?: string;
  toneGuidelines?: string[];
  interactionRules?: string[];
  topicSpecificTips?: string[];
}

export function formatImprovedCustomInstructions(
  instructions: ImprovedCustomInstructions,
  {
    topicText
  }: {
    topicText?: string;
  } = {}
) {
  const fallbackTopic = (topicText || 'this topic').trim() || 'this topic';
  const sanitizeList = (list?: string[], fallback: string[] = []) => {
    const sanitized = Array.isArray(list)
      ? list
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : [];
    return sanitized.length > 0 ? sanitized : fallback;
  };

  const formatList = (items: string[]) =>
    items.map((item) => `   - ${item}`).join('\n');

  const purpose =
    typeof instructions?.purpose === 'string' &&
    instructions.purpose.trim().length > 0
      ? instructions.purpose.trim()
      : `Help the user practice and explore ${fallbackTopic} with actionable, supportive suggestions.`;

  const toneGuidelines = sanitizeList(instructions?.toneGuidelines, [
    'Use upbeat, encouraging language without sounding childish.',
    'Keep sentences short and easy to follow.'
  ]);

  const interactionRules = sanitizeList(instructions?.interactionRules, [
    'Provide clear, step-by-step guidance before offering extras.',
    'Only ask a clarifying question when the user explicitly requests different help.',
    'Acknowledge the user’s effort and restate their goal before giving advice.'
  ]);

  const topicSpecificTips = sanitizeList(instructions?.topicSpecificTips, [
    `Relate every response back to ${fallbackTopic} with concrete examples.`,
    'Suggest quick practice ideas or resources the user can try immediately.'
  ]);

  return [
    '1. Purpose',
    `   - ${purpose}`,
    '',
    '2. Tone & Language Guidelines',
    formatList(toneGuidelines),
    '',
    '3. Interaction Rules',
    formatList(interactionRules),
    '',
    '4. Topic-Specific Tips',
    formatList(topicSpecificTips)
  ]
    .join('\n')
    .trim();
}

export function deriveImprovedInstructionsText({
  structuredContent,
  topicText,
  fallbackText
}: {
  structuredContent?: string;
  topicText?: string;
  fallbackText: string;
}) {
  if (!structuredContent) return fallbackText;
  try {
    const parsed = JSON.parse(structuredContent) as ImprovedCustomInstructions;
    const formatted = formatImprovedCustomInstructions(parsed, { topicText });
    return formatted || fallbackText;
  } catch {
    return fallbackText;
  }
}
