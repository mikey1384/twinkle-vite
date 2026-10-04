import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BUILD_WORKSPACE_COMPACT_MEDIA_QUERY } from '../../constants';
import {
  resolveReplanNotice,
  resolveStopConfirmAnswered,
  resolveRoadmapActionRequest,
  resolveRoadmapSurfaces,
  resolveRoadmapView,
  type RoadmapAction,
  type RoadmapUiMemory
} from '../../helpers/roadmap';
import type { BuildExecutionPlan } from '../../types';
import MilestoneCelebration from './MilestoneCelebration';
import RoadmapCompleteCard, {
  type RoadmapPublishControl
} from './RoadmapCompleteCard';
import RoadmapPanel from './RoadmapPanel';
import RoadmapProposalCard from './RoadmapProposalCard';
import RoadmapProposalStrip from './RoadmapProposalStrip';
import RoadmapStopConfirm from './RoadmapStopConfirm';

export type { RoadmapPublishControl };

const STORAGE_PREFIX = 'lumine-roadmap-ui:';
const BUSY_TIMEOUT_MS = 20000;

function readMemory(key: string): RoadmapUiMemory {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMemory(key: string, memory: RoadmapUiMemory) {
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(memory)
    );
  } catch {
    // Private windows and blocked storage just forget the choice.
  }
}

function defaultCollapsed() {
  try {
    return window.matchMedia(BUILD_WORKSPACE_COMPACT_MEDIA_QUERY).matches;
  } catch {
    return false;
  }
}

// Everything the Lumine chat shows for a roadmap: the pinned panel (above
// the transcript) and the card at the end of the transcript. ChatPanel only
// places the two nodes; which one shows is resolveRoadmapSurfaces's call.
export function useRoadmapSurfaces({
  executionPlan,
  generating,
  isOwner,
  disabled,
  onSendRoadmapAction,
  onPlayPreview,
  publishControl,
  latestUserMessageAt = 0,
  proposalAnswered = false,
  messages
}: {
  // The chat, to tell whether the kid replied to a stop confirmation.
  messages?: Array<{
    id?: number | string | null;
    role?: string | null;
    createdAt?: number | null;
    source?: string | null;
  }>;
  executionPlan: BuildExecutionPlan | null | undefined;
  generating: boolean;
  latestUserMessageAt?: number;
  // resolveProposalAnswered(messages, executionPlan)
  proposalAnswered?: boolean;
  isOwner: boolean;
  disabled?: boolean;
  onSendRoadmapAction?: (request: {
    message: string;
    planAction: NonNullable<
      ReturnType<typeof resolveRoadmapActionRequest>
    >['planAction'];
  }) => void | Promise<unknown>;
  onPlayPreview?: () => void;
  publishControl?: RoadmapPublishControl | null;
}) {
  const view = useMemo(
    () => resolveRoadmapView(executionPlan, { generating }),
    [executionPlan, generating]
  );
  const viewKey = view?.key || '';
  const [memory, setMemory] = useState<RoadmapUiMemory>(() =>
    viewKey ? readMemory(viewKey) : {}
  );
  const [busyAction, setBusyAction] = useState<RoadmapAction | null>(null);
  // "View" on the proposal strip brings the full card back to the end of
  // the chat until the kid writes again.
  const [proposalOpened, setProposalOpened] = useState(false);
  useEffect(() => {
    setProposalOpened(false);
  }, [viewKey, latestUserMessageAt]);

  useEffect(() => {
    setMemory(viewKey ? readMemory(viewKey) : {});
  }, [viewKey]);

  // A press is busy until the plan or the run moves (or a safety timeout).
  const planVersion = `${executionPlan?.status || ''}:${executionPlan?.updatedAt || 0}`;
  useEffect(() => {
    setBusyAction(null);
  }, [planVersion, generating]);
  useEffect(() => {
    if (!busyAction) return;
    const timeout = window.setTimeout(
      () => setBusyAction(null),
      BUSY_TIMEOUT_MS
    );
    return () => window.clearTimeout(timeout);
  }, [busyAction]);

  const updateMemory = useCallback(
    (patch: Partial<RoadmapUiMemory>) => {
      if (!viewKey) return;
      setMemory((current) => {
        const next = { ...current, ...patch };
        writeMemory(viewKey, next);
        return next;
      });
    },
    [viewKey]
  );

  const handleAction = useCallback(
    (action: RoadmapAction) => {
      if (busyAction || !onSendRoadmapAction) return;
      const request = resolveRoadmapActionRequest(action, view);
      if (!request) return;
      setBusyAction(action);
      Promise.resolve(onSendRoadmapAction(request)).catch(() =>
        setBusyAction(null)
      );
    },
    [busyAction, onSendRoadmapAction, view]
  );

  const surfaces = resolveRoadmapSurfaces(view, {
    generating,
    memory,
    latestUserMessageAt,
    proposalAnswered,
    proposalOpened,
    stopConfirmAnswered: resolveStopConfirmAnswered(messages || [], view)
  });
  const canAct = isOwner && Boolean(onSendRoadmapAction);
  const collapsed =
    typeof memory.collapsed === 'boolean'
      ? memory.collapsed
      : defaultCollapsed();

  const handleViewProposal = useCallback(() => {
    setProposalOpened(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`build-roadmap-proposal-${viewKey}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [viewKey]);

  const panelNode =
    view && surfaces.strip ? (
      <RoadmapProposalStrip
        view={view}
        canAct={canAct}
        disabled={disabled || generating}
        busyAction={busyAction}
        onAction={handleAction}
        onView={handleViewProposal}
      />
    ) : view && surfaces.panel ? (
      <RoadmapPanel
        view={view}
        collapsed={collapsed}
        generating={generating}
        canAct={canAct}
        disabled={disabled}
        busyAction={busyAction}
        onToggleCollapsed={() => updateMemory({ collapsed: !collapsed })}
        onAction={handleAction}
        replanNotice={resolveReplanNotice(view, memory)}
        onDismissReplan={() =>
          updateMemory({ replanSeenAt: view.replan?.at || 0 })
        }
      />
    ) : null;

  const transcriptCardKind = surfaces.transcriptCard;
  const lastDoneId = view?.lastDone?.id || null;
  const transcriptNode = useMemo(() => {
    if (!view || !transcriptCardKind) return null;
    if (transcriptCardKind === 'stop_confirm') {
      return canAct ? (
        <RoadmapStopConfirm
          busy={busyAction === 'cancel'}
          onStop={() => handleAction('cancel')}
          onKeep={() =>
            updateMemory({ stopConfirmDismissedAt: view.stopConfirm?.at || 0 })
          }
        />
      ) : null;
    }
    if (transcriptCardKind === 'proposal') {
      return (
        <RoadmapProposalCard
          domId={`build-roadmap-proposal-${view.key}`}
          view={view}
          canAct={canAct}
          disabled={disabled}
          busyAction={busyAction}
          onAction={handleAction}
        />
      );
    }
    if (transcriptCardKind === 'celebration') {
      return (
        <MilestoneCelebration
          view={view}
          canAct={canAct}
          disabled={disabled}
          busyAction={busyAction}
          onAction={handleAction}
          onPlay={onPlayPreview}
          onTomorrow={() => updateMemory({ offerDismissedFor: lastDoneId })}
        />
      );
    }
    return (
      <RoadmapCompleteCard
        view={view}
        canAct={canAct}
        publishControl={publishControl}
        onPlay={onPlayPreview}
        onClose={canAct ? () => updateMemory({ closed: true }) : undefined}
      />
    );
  }, [
    busyAction,
    canAct,
    disabled,
    handleAction,
    lastDoneId,
    onPlayPreview,
    publishControl,
    transcriptCardKind,
    updateMemory,
    view
  ]);

  return {
    // True whenever the plan is a roadmap: the old scoped-plan quick replies
    // must stay out of the way.
    isRoadmap: Boolean(view),
    view,
    panelNode,
    transcriptNode
  };
}
