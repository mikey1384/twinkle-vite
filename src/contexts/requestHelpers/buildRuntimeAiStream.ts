export interface BuildRuntimeAiStreamEvent {
  type?: string;
  status?: string;
  text?: string;
  response?: string;
  delta?: string;
  done?: boolean;
  model?: string;
  provider?: string;
  thinkingMode?: string;
  requestedThinkingMode?: string;
  requestedModel?: string | null;
  webSearch?: boolean;
  aiUsagePolicy?: Record<string, any>;
  object?: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  code?: string;
}

function buildIncompleteAiStreamError() {
  const error: any = new Error(
    'AI stream ended before a final result was received.'
  );
  error.code = 'build_ai_stream_incomplete';
  return error;
}

export async function readBuildRuntimeAiStream({
  response,
  onEvent
}: {
  response: Response;
  onEvent?: (event: BuildRuntimeAiStreamEvent) => void;
}) {
  const decoder = new TextDecoder();
  const reader = response.body?.getReader();
  let buffer = '';
  let finalEvent: BuildRuntimeAiStreamEvent | null = null;

  function consumeLine(rawLine: string) {
    const line = rawLine.trim();
    if (!line) return;
    const event = JSON.parse(line) as BuildRuntimeAiStreamEvent;
    onEvent?.(event);
    if (event.type === 'error') {
      const error: any = new Error(event.error || 'AI stream failed');
      if (event.code) error.code = event.code;
      if (event.aiUsagePolicy) {
        error.aiUsagePolicy = event.aiUsagePolicy;
      }
      throw error;
    }
    if (event.type === 'done') {
      finalEvent = event;
    }
  }

  if (!reader) {
    const text = await response.text();
    text.split('\n').forEach(consumeLine);
  } else {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        consumeLine(line);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      consumeLine(buffer);
    }
  }

  if (!finalEvent) {
    throw buildIncompleteAiStreamError();
  }
  return finalEvent;
}
