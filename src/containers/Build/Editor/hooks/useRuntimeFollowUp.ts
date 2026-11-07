import { useRef, useState } from 'react';
import type {
  BuildRuntimeObservationIssue,
  BuildRuntimeObservationState
} from '../../types/runtimeObservationTypes';
import { formatBuildRuntimeAppStartedLine } from '../../PreviewPanel/helpers/runtimeAppStarted';
import {
  pickRuntimeObservationForBuildFiles,
  type BuildPreviewFilesSource,
  type BuildPreviewVersionSource
} from '../../helpers/previewVersion';

const RUNTIME_OBSERVATION_ISSUE_BUFFER_LIMIT = 8;

interface RuntimeObservationChatNote {
  id: number;
  role: 'assistant';
  content: string;
  codeGenerated: null;
  streamCodePreview: null;
  billingState: null;
  artifactVersionId?: null;
  createdAt: number;
  persisted: false;
  source: 'runtime_observation';
  runtimeObservationIssueKey: string;
  runtimeObservationOriginalContent?: string | null;
  runtimeObservationResolved?: boolean;
  runtimeObservationResolvedAt?: number | null;
}

interface AppendLocalRunEventOptions {
  kind: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
}

interface UseRuntimeBuildFollowUpOptions {
  isOwner: boolean;
  onAppendLocalRunEvent: (event: AppendLocalRunEventOptions) => void;
  onScrollChatToBottom: (behavior?: ScrollBehavior) => void;
}

function formatRuntimeObservationIssueKindLabel(
  kind: BuildRuntimeObservationIssue['kind']
) {
  switch (kind) {
    case 'consoleerror':
      return 'Console message';
    case 'unhandledrejection':
      return 'Unhandled rejection';
    case 'blankrender':
      return 'Blank render';
    case 'formsubmitblocked':
      return 'Sandbox-blocked form submit';
    case 'sdkblocked':
      return 'Blocked capability call';
    case 'interactionnoop':
      return 'No-op interaction';
    case 'keyboardscroll':
      return 'Keyboard scroll leak';
    case 'playfieldmismatch':
      return 'Gameplay escaped playfield';
    case 'error':
    default:
      return 'Runtime error';
  }
}

function shouldSurfaceRuntimeObservationIssueInChat(
  issue: BuildRuntimeObservationIssue
) {
  switch (issue.kind) {
    case 'consoleerror':
    case 'error':
    case 'unhandledrejection':
    case 'formsubmitblocked':
    case 'sdkblocked':
      return true;
    case 'blankrender':
    case 'interactionnoop':
    case 'keyboardscroll':
    case 'playfieldmismatch':
    default:
      return false;
  }
}

function formatRuntimeObservationIssueLocationText(
  issue: BuildRuntimeObservationIssue
) {
  const locationParts = [
    issue.filename || null,
    issue.lineNumber != null ? `line ${issue.lineNumber}` : null,
    issue.columnNumber != null ? `col ${issue.columnNumber}` : null
  ].filter(Boolean);
  return locationParts.length > 0 ? ` (${locationParts.join(', ')})` : '';
}

function formatRuntimeObservationChatNote(issue: BuildRuntimeObservationIssue) {
  const kindLabel = formatRuntimeObservationIssueKindLabel(issue.kind);
  const locationText = formatRuntimeObservationIssueLocationText(issue);
  const stackLine = String(issue.stack || '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  return [
    'Preview issue detected.',
    `${kindLabel}: ${issue.message}${locationText}`,
    stackLine ? `Stack: ${stackLine.slice(0, 260)}` : null
  ]
    .filter(Boolean)
    .join('\n');
}

function formatResolvedRuntimeObservationChatNote(content: string) {
  const lines = String(content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const detailLines = lines.filter(
    (line) => line !== 'Preview issue detected.'
  );
  if (!detailLines.length) {
    return 'Preview issue resolved.';
  }
  return [
    'Preview issue resolved.',
    ...detailLines.map((line, index) =>
      index === 0 ? `Previously: ${line}` : line
    )
  ].join('\n');
}

function restoreRuntimeObservationChatNoteContent(content: string) {
  const lines = String(content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines[0] !== 'Preview issue resolved.') {
    return lines.join('\n');
  }
  const detailLines = lines.slice(1);
  if (detailLines[0]?.startsWith('Previously: ')) {
    detailLines[0] = detailLines[0].replace(/^Previously:\s*/, '');
  }
  return ['Preview issue detected.', ...detailLines].join('\n').trim();
}

function hasHealthyRuntimeObservationForNoteResolution(
  observationState: BuildRuntimeObservationState
) {
  const health = observationState.health;
  if (!health?.meaningfulRender) return false;
  if (health.gameplayTelemetry?.status === 'out-of-bounds') return false;
  if (
    health.gameLike &&
    ((health.viewportOverflowY || 0) > 48 ||
      (health.viewportOverflowX || 0) > 24)
  ) {
    return false;
  }
  return true;
}

function buildRuntimeObservationIssueChatKey({
  buildId,
  codeSignature,
  issue
}: {
  buildId: number;
  codeSignature: string | null;
  issue: BuildRuntimeObservationIssue;
}) {
  return [
    buildId,
    codeSignature || '',
    issue.kind,
    issue.message,
    issue.filename || '',
    issue.lineNumber || 0,
    issue.columnNumber || 0
  ].join('|');
}

function formatRuntimeObservationSummary(
  observationState: BuildRuntimeObservationState | null
) {
  if (
    !observationState ||
    (observationState.issues.length === 0 && !observationState.health)
  ) {
    return '';
  }
  const issuesText = observationState.issues
    .slice(-5)
    .map((issue, index) => {
      const locationText = formatRuntimeObservationIssueLocationText(issue);
      const stackLine = String(issue.stack || '')
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean);
      return [
        `${index + 1}. ${formatRuntimeObservationIssueKindLabel(issue.kind)}: ${issue.message}${locationText}`,
        stackLine ? `   stack: ${stackLine.slice(0, 260)}` : null
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  const health = observationState.health;
  const interactionText =
    health?.interactionStatus === 'changed'
      ? `changed the UI after clicking ${
          health.interactionTargetLabel
            ? `"${health.interactionTargetLabel}"`
            : 'a control'
        }`
      : health?.interactionStatus === 'unchanged'
        ? `clicked ${
            health.interactionTargetLabel
              ? `"${health.interactionTargetLabel}"`
              : 'a control'
          }, but nothing visibly changed`
        : health?.interactionStatus === 'skipped'
          ? 'skipped because no safe startup control was found'
          : null;
  const interactionStepLines = (health?.interactionSteps || [])
    .slice(-2)
    .map((step, index) => {
      const prefix =
        step.source === 'planned'
          ? `${index + 1}. planned ${step.actionKind || 'step'}`
          : `${index + 1}. clicked`;
      const parts = [
        prefix +
          ' ' +
          (step.targetLabel ? `"${step.targetLabel}"` : 'a control'),
        step.goal ? `goal: ${step.goal}` : null,
        step.expectedSignals?.routeChange === true
          ? 'expected: route should change'
          : step.expectedSignals?.routeChange === false
            ? 'expected: stay on same route'
            : null,
        step.expectedSignals && step.expectedSignals.textIncludes.length > 0
          ? `expected text: ${step.expectedSignals.textIncludes
              .map((text) => `"${text}"`)
              .join(', ')}`
          : null,
        step.expectedSignals && step.expectedSignals.revealsLabels.length > 0
          ? `expected controls: ${step.expectedSignals.revealsLabels
              .map((label) => `"${label}"`)
              .join(', ')}`
          : null,
        step.routeChanged && step.routeAfter
          ? `route -> ${step.routeAfter}`
          : null,
        step.hashChanged && step.hashAfter ? `hash -> ${step.hashAfter}` : null,
        step.headingDelta !== 0 ||
        step.buttonDelta !== 0 ||
        step.formDelta !== 0
          ? `headings/buttons/forms delta: ${step.headingDelta >= 0 ? '+' : ''}${step.headingDelta}/${step.buttonDelta >= 0 ? '+' : ''}${step.buttonDelta}/${step.formDelta >= 0 ? '+' : ''}${step.formDelta}`
          : null,
        step.revealedTargetLabels.length > 0
          ? `revealed: ${step.revealedTargetLabels
              .map((label) => `"${label}"`)
              .join(', ')}`
          : null
      ].filter(Boolean);
      const textDelta =
        step.visibleTextBefore !== step.visibleTextAfter &&
        (step.visibleTextBefore || step.visibleTextAfter)
          ? `   text: ${
              step.visibleTextBefore ? `"${step.visibleTextBefore}"` : '[none]'
            } -> ${
              step.visibleTextAfter ? `"${step.visibleTextAfter}"` : '[none]'
            }`
          : null;
      return [parts.join('; '), textDelta].filter(Boolean).join('\n');
    });
  const healthLines = health
    ? [
        'Preview health:',
        formatBuildRuntimeAppStartedLine(health, observationState.issues),
        `- meaningful UI: ${health.meaningfulRender ? 'yes' : 'no'}`,
        health.gameLike ? '- game-like preview: yes' : null,
        `- headings/buttons/forms: ${health.headingCount}/${health.buttonCount}/${health.formCount}`,
        health.viewportOverflowY > 0 || health.viewportOverflowX > 0
          ? `- viewport overflow (y/x): ${health.viewportOverflowY}px / ${health.viewportOverflowX}px`
          : null,
        health.gameplayTelemetry
          ? `- gameplay telemetry: ${health.gameplayTelemetry.status}`
          : null,
        health.gameplayTelemetry &&
        (health.gameplayTelemetry.overflowTop > 0 ||
          health.gameplayTelemetry.overflowRight > 0 ||
          health.gameplayTelemetry.overflowBottom > 0 ||
          health.gameplayTelemetry.overflowLeft > 0)
          ? `- gameplay overflow (top/right/bottom/left): ${health.gameplayTelemetry.overflowTop}px / ${health.gameplayTelemetry.overflowRight}px / ${health.gameplayTelemetry.overflowBottom}px / ${health.gameplayTelemetry.overflowLeft}px`
          : null,
        interactionText ? `- interaction probe: ${interactionText}` : null,
        interactionStepLines.length > 0
          ? `- interaction steps:\n${interactionStepLines
              .map((line) => `  ${line.replace(/\n/g, '\n  ')}`)
              .join('\n')}`
          : null,
        health.visibleTextSample
          ? `- visible text: ${health.visibleTextSample}`
          : null
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  if (!issuesText) {
    return healthLines;
  }
  return [healthLines, issuesText].filter(Boolean).join('\n\n');
}

export default function useRuntimeFollowUp({
  isOwner,
  onAppendLocalRunEvent,
  onScrollChatToBottom
}: UseRuntimeBuildFollowUpOptions) {
  const [runtimeObservationChatNotes, setRuntimeObservationChatNotes] =
    useState<RuntimeObservationChatNote[]>([]);
  const [runtimeFollowUpRevision, setRuntimeFollowUpRevision] = useState(0);
  const runtimeObservationStateRef =
    useRef<BuildRuntimeObservationState | null>(null);
  const runtimeObservationChatNoteKeysRef = useRef<Set<string>>(new Set());
  const lastRuntimeHealthEventKeyRef = useRef('');
  const externalRef = useRef({
    isOwner,
    onAppendLocalRunEvent,
    onScrollChatToBottom
  });

  externalRef.current = {
    isOwner,
    onAppendLocalRunEvent,
    onScrollChatToBottom
  };

  function bumpRuntimeFollowUpRevision() {
    setRuntimeFollowUpRevision((current) => current + 1);
  }

  function reset() {
    runtimeObservationStateRef.current = null;
    setRuntimeObservationChatNotes([]);
    runtimeObservationChatNoteKeysRef.current = new Set();
    lastRuntimeHealthEventKeyRef.current = '';
  }

  function captureRuntimeObservation() {
    return runtimeObservationStateRef.current;
  }

  // Only what the preview saw on the exact files the run starts from. Right
  // after a run saves, the preview may still be reporting the files before
  // it; those errors must not reach Lumine as current. `capturedBeforeSave`
  // is the observation taken before the pre-run save, in case the preview
  // reloaded during that save.
  function getRuntimeObservationSummaryForBuild(
    build: BuildPreviewVersionSource & BuildPreviewFilesSource,
    capturedBeforeSave: BuildRuntimeObservationState | null = null
  ) {
    const observationState = pickRuntimeObservationForBuildFiles(
      [runtimeObservationStateRef.current, capturedBeforeSave],
      build
    );
    return observationState
      ? formatRuntimeObservationSummary(observationState)
      : '';
  }

  function removeRuntimeObservationChatNote(messageId: number) {
    setRuntimeObservationChatNotes((prev) =>
      prev.filter((entry) => entry.id !== messageId)
    );
  }

  function handleRuntimeObservationChange(
    nextState: BuildRuntimeObservationState
  ) {
    if (runtimeObservationStateRef.current === nextState) {
      return;
    }
    const previousState = runtimeObservationStateRef.current;
    const previousIssueKeys = new Set(
      (previousState?.issues || []).map((issue) =>
        buildRuntimeObservationIssueChatKey({
          buildId: previousState?.buildId || nextState.buildId,
          codeSignature: previousState?.codeSignature || null,
          issue
        })
      )
    );
    const nextChatNotes: RuntimeObservationChatNote[] = [];
    const nextIssueContentByKey = new Map<string, string>();
    const unresolvedIssueKeys = new Set(
      nextState.issues.map((issue) =>
        buildRuntimeObservationIssueChatKey({
          buildId: nextState.buildId,
          codeSignature: nextState.codeSignature || null,
          issue
        })
      )
    );
    for (const issue of nextState.issues) {
      if (!shouldSurfaceRuntimeObservationIssueInChat(issue)) {
        continue;
      }
      const issueKey = buildRuntimeObservationIssueChatKey({
        buildId: nextState.buildId,
        codeSignature: nextState.codeSignature || null,
        issue
      });
      const issueContent = formatRuntimeObservationChatNote(issue);
      nextIssueContentByKey.set(issueKey, issueContent);
      if (
        previousIssueKeys.has(issueKey) ||
        runtimeObservationChatNoteKeysRef.current.has(issueKey)
      ) {
        continue;
      }
      runtimeObservationChatNoteKeysRef.current.add(issueKey);
      nextChatNotes.push({
        id: -(Date.now() + Math.floor(Math.random() * 1000)),
        role: 'assistant',
        content: issueContent,
        codeGenerated: null,
        billingState: null,
        streamCodePreview: null,
        createdAt: Math.max(
          1,
          Math.floor(Number(issue.createdAt || Date.now()) / 1000)
        ),
        persisted: false,
        source: 'runtime_observation',
        runtimeObservationIssueKey: issueKey,
        runtimeObservationOriginalContent: issueContent
      });
    }
    if (externalRef.current.isOwner) {
      const resolvedAt = Date.now();
      const canTrustMissingIssueKeys = Boolean(
        hasHealthyRuntimeObservationForNoteResolution(nextState) &&
          nextState.issues.length < RUNTIME_OBSERVATION_ISSUE_BUFFER_LIMIT
      );
      setRuntimeObservationChatNotes((prev) => {
        let changed = nextChatNotes.length > 0;
        const resolvedPreviousNotes = prev.map((note) => {
          const issueKey = note.runtimeObservationIssueKey;
          if (issueKey && unresolvedIssueKeys.has(issueKey)) {
            if (!note.runtimeObservationResolved) {
              return note;
            }
            const activeContent =
              nextIssueContentByKey.get(issueKey) ||
              note.runtimeObservationOriginalContent ||
              restoreRuntimeObservationChatNoteContent(note.content);
            changed = true;
            return {
              ...note,
              content: activeContent,
              runtimeObservationOriginalContent: activeContent,
              runtimeObservationResolved: false,
              runtimeObservationResolvedAt: null
            };
          }
          if (
            !canTrustMissingIssueKeys ||
            note.runtimeObservationResolved ||
            !note.runtimeObservationIssueKey
          ) {
            return note;
          }
          changed = true;
          return {
            ...note,
            content: formatResolvedRuntimeObservationChatNote(
              note.runtimeObservationOriginalContent || note.content
            ),
            runtimeObservationOriginalContent:
              note.runtimeObservationOriginalContent || note.content,
            runtimeObservationResolved: true,
            runtimeObservationResolvedAt: resolvedAt
          };
        });
        if (!changed) return prev;
        return [...resolvedPreviousNotes, ...nextChatNotes].slice(-12);
      });
      if (nextChatNotes.length > 0) {
        externalRef.current.onScrollChatToBottom('smooth');
      }
    }
    const health = nextState.health;
    if (health) {
      const healthEventKey = [
        nextState.buildId,
        nextState.codeSignature || '',
        health.booted ? '1' : '0',
        health.meaningfulRender ? '1' : '0',
        health.gameLike ? '1' : '0',
        health.headingCount,
        health.buttonCount,
        health.formCount,
        health.viewportOverflowY,
        health.viewportOverflowX,
        health.gameplayTelemetry?.status || '',
        health.gameplayTelemetry?.overflowTop || 0,
        health.gameplayTelemetry?.overflowRight || 0,
        health.gameplayTelemetry?.overflowBottom || 0,
        health.gameplayTelemetry?.overflowLeft || 0,
        health.interactionStatus,
        health.interactionTargetLabel || '',
        JSON.stringify(health.interactionSteps || []),
        health.visibleTextSample || ''
      ].join('|');
      if (lastRuntimeHealthEventKeyRef.current !== healthEventKey) {
        lastRuntimeHealthEventKeyRef.current = healthEventKey;
        const interactionTargetText = health.interactionTargetLabel
          ? `"${health.interactionTargetLabel}"`
          : 'a control';
        const interactionStepCount = (health.interactionSteps || []).length;
        const latestInteractionStep =
          interactionStepCount > 0
            ? health.interactionSteps[interactionStepCount - 1]
            : null;
        const previewHealthMessage =
          health.gameLike &&
          (health.viewportOverflowY > 48 || health.viewportOverflowX > 24)
            ? 'The preview opened, but the game is spilling outside the screen.'
            : health.gameplayTelemetry?.status === 'out-of-bounds'
              ? 'The preview opened, but the game is letting the player move outside the play area.'
              : interactionStepCount >= 2 &&
                  health.interactionStatus === 'changed' &&
                  latestInteractionStep?.source === 'planned'
                ? `Lumine tried ${interactionStepCount} steps in the preview and the app changed.`
                : interactionStepCount >= 2 &&
                    health.interactionStatus === 'changed'
                  ? `Lumine tried ${interactionStepCount} startup steps in the preview and the app changed.`
                  : health.interactionStatus === 'changed'
                    ? latestInteractionStep?.source === 'planned'
                      ? latestInteractionStep?.routeChanged &&
                        latestInteractionStep.routeAfter
                        ? `Lumine clicked ${interactionTargetText} and the app moved to ${latestInteractionStep.routeAfter}.`
                        : `Lumine clicked ${interactionTargetText} and the app moved forward.`
                      : latestInteractionStep?.routeChanged &&
                          latestInteractionStep.routeAfter
                        ? `Lumine clicked ${interactionTargetText} and the app moved to ${latestInteractionStep.routeAfter}.`
                        : `Lumine clicked ${interactionTargetText} and the screen changed.`
                    : health.interactionStatus === 'unchanged'
                      ? latestInteractionStep?.source === 'planned'
                        ? `Lumine clicked ${interactionTargetText}, but the app did not move forward.`
                        : `Lumine clicked ${interactionTargetText}, but the screen did not change.`
                      : health.meaningfulRender
                        ? 'The preview opened and looks ready.'
                        : 'The preview opened, but it still looks empty.';
        if (
          previewHealthMessage !==
            'The preview opened and looks ready.' &&
          previewHealthMessage !==
            'The preview opened, but it still looks empty.'
        ) {
          externalRef.current.onAppendLocalRunEvent({
            kind:
              health.interactionStatus === 'changed' || health.meaningfulRender
                ? 'action'
                : 'status',
            phase: 'preview',
            message: previewHealthMessage
          });
        }
      }
    }
    runtimeObservationStateRef.current = nextState;
  }

  return {
    runtimeObservationChatNotes,
    runtimeFollowUpRevision,
    bumpRuntimeFollowUpRevision,
    reset,
    captureRuntimeObservation,
    getRuntimeObservationSummaryForBuild,
    handleRuntimeObservationChange,
    removeRuntimeObservationChatNote
  };
}
