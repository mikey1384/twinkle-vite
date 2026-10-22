import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { css } from '@emotion/css';
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
import RoadmapSummary from './RoadmapSummary';

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

const proposalWorkspaceClass = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.2rem;
`;

// The small summary, the full workspace view, and milestones in the chat
// all use the same server-owned plan and action state.
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
  const [planOpened, setPlanOpened] = useState(false);
  const planOpenerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    setPlanOpened(false);
  }, [viewKey]);
  useEffect(() => {
    // Return to the conversation when an accepted action starts a new run.
    if (generating) setPlanOpened(false);
  }, [generating]);
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
    stopConfirmAnswered: resolveStopConfirmAnswered(messages || [], view)
  });
  const canAct = isOwner && Boolean(onSendRoadmapAction);
  function openPlan(event: React.MouseEvent<HTMLButtonElement>) {
    // Safari does not focus buttons on pointer clicks. Remember the actual
    // opener rather than relying on document.activeElement for the return.
    planOpenerRef.current = event.currentTarget;
    setPlanOpened(true);
  }

  const panelNode =
    view && surfaces.strip ? (
      <RoadmapProposalStrip
        view={view}
        canAct={canAct}
        disabled={disabled || generating}
        busyAction={busyAction}
        onAction={handleAction}
        onView={openPlan}
      />
    ) : view && surfaces.panel ? (
      <RoadmapSummary
        view={view}
        canAct={canAct}
        updated={Boolean(resolveReplanNotice(view, memory))}
        onOpen={openPlan}
      />
    ) : null;

  const planNode =
    view && surfaces.strip ? (
      <div className={proposalWorkspaceClass}>
        <RoadmapProposalCard
          view={view}
          canAct={canAct}
          disabled={disabled || generating}
          busyAction={busyAction}
          onAction={handleAction}
        />
      </div>
    ) : view && surfaces.panel ? (
      <RoadmapPanel
        key={view.key}
        view={view}
        generating={generating}
        canAct={canAct}
        disabled={disabled}
        busyAction={busyAction}
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
    planNode,
    planOpenerRef,
    planOpened: Boolean(planNode) && planOpened,
    closePlan: () => setPlanOpened(false),
    transcriptNode
  };
}
