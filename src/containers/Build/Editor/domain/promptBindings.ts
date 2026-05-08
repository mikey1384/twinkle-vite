import type {
  BuildExecutionPlan,
  BuildExecutionPlanChunk,
  BuildFollowUpAcceptPromptBinding,
  BuildFollowUpPrompt,
  BuildScopedPlanContinuePromptBinding
} from '../types';

export function isExecutableBuildExecutionChunkStatus(
  status: BuildExecutionPlanChunk['status']
) {
  return (
    status === 'pending' || status === 'in_progress' || status === 'blocked'
  );
}

export function resolveBuildExecutionPlanTarget(
  plan: BuildExecutionPlan | null | undefined
) {
  if (!plan?.plan?.chunks?.length) return null;
  if (plan.plan.mode === 'too_broad') {
    if (plan.currentBigChunkId && plan.currentChunkId) {
      const currentBigChunk = plan.plan.chunks.find(
        (chunk) => chunk.id === plan.currentBigChunkId
      );
      const currentChunk = currentBigChunk?.chunks.find(
        (chunk) => chunk.id === plan.currentChunkId
      );
      if (currentBigChunk && currentChunk) {
        return {
          chunkTitle: currentChunk.title,
          bigChunkTitle: currentBigChunk.title
        };
      }
    }
    for (const bigChunk of plan.plan.chunks) {
      for (const chunk of bigChunk.chunks || []) {
        if (!isExecutableBuildExecutionChunkStatus(chunk.status)) continue;
        return {
          chunkTitle: chunk.title,
          bigChunkTitle: bigChunk.title
        };
      }
    }
    return null;
  }

  if (plan.currentChunkId) {
    const currentChunk = plan.plan.chunks.find(
      (chunk) => chunk.id === plan.currentChunkId
    );
    if (currentChunk) {
      return {
        chunkTitle: currentChunk.title,
        bigChunkTitle: null
      };
    }
  }

  const nextChunk = plan.plan.chunks.find((chunk) =>
    isExecutableBuildExecutionChunkStatus(chunk.status)
  );
  return nextChunk
    ? {
        chunkTitle: nextChunk.title,
        bigChunkTitle: null
      }
    : null;
}

export function resolveScopedPlanQuestion(
  plan: BuildExecutionPlan | null | undefined
) {
  const explicitQuestion = String(
    plan?.question || plan?.plan?.question || ''
  ).trim();
  if (explicitQuestion) return explicitQuestion;
  const target = resolveBuildExecutionPlanTarget(plan);
  if (!target) return '';
  return target.bigChunkTitle
    ? `Should Lumine keep going with ${target.chunkTitle} under ${target.bigChunkTitle}?`
    : `Should Lumine keep going with ${target.chunkTitle}?`;
}

export function resolveBuildFollowUpPromptKey(
  prompt: BuildFollowUpPrompt | null | undefined
) {
  const sourceMessageId = Number(prompt?.sourceMessageId || 0);
  if (sourceMessageId > 0) {
    return `message:${sourceMessageId}`;
  }
  const question = String(prompt?.question || '').trim();
  const suggestedMessage = String(prompt?.suggestedMessage || '').trim();
  if (!question && !suggestedMessage) {
    return '';
  }
  return `${question}::${suggestedMessage}`;
}

export function buildScopedPlanContinuePromptBinding(
  plan: BuildExecutionPlan | null | undefined
): BuildScopedPlanContinuePromptBinding | null {
  if (!plan || plan.status !== 'awaiting_confirmation') {
    return null;
  }
  const question = resolveScopedPlanQuestion(plan);
  return {
    kind: 'scoped_plan_continue',
    question: question || null,
    executionPlan: plan
  };
}

export function buildFollowUpAcceptPromptBinding(
  prompt: BuildFollowUpPrompt | null | undefined
): BuildFollowUpAcceptPromptBinding | null {
  const suggestedMessage = String(prompt?.suggestedMessage || '').trim();
  if (!suggestedMessage) {
    return null;
  }
  const question = String(prompt?.question || '').trim();
  const sourceMessageId = Number(prompt?.sourceMessageId || 0);
  return {
    kind: 'follow_up_accept',
    question: question || null,
    suggestedMessage,
    sourceMessageId: sourceMessageId > 0 ? sourceMessageId : null
  };
}
