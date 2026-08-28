/* eslint-disable react-hooks/exhaustive-deps -- Context request helpers are stable and must not enter hook dependency arrays. */
import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react';
import {
  BUILD_WORKSHOP_PREVIEW_USER_IDS,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useKeyContext } from '~/contexts';

type WorkshopPersona = 'zero' | 'ciel';
type DialogueDirection = 'persona_to_lumine' | 'lumine_to_persona';

export interface LumineDialogueEntry {
  id: number;
  direction: DialogueDirection;
  speaker: 'Zero' | 'Ciel' | 'Lumine';
  message: string;
  kind: 'approved_plan' | 'approved_follow_up' | 'progress';
  phase: string | null;
  createdAt: number | null;
}

export interface LumineDialogueState {
  requesterUserId: number;
  jobId: number;
  channelId: number;
  topicId: number | null;
  persona: WorkshopPersona;
  personaName: 'Zero' | 'Ciel';
  jobStatus: string;
  canProgress: boolean;
  dialogue: LumineDialogueEntry[];
}

const ACTIVE_JOB_STATUSES = new Set([
  'queued',
  'leased',
  'working',
  'waiting_user'
]);
const POLL_MS = 5_000;

export default function useLumineDialogue({
  partnerId,
  selectedChannelId,
  topicId,
  enabled
}: {
  partnerId?: number;
  selectedChannelId: number;
  topicId: number | null;
  enabled: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadBuildWorkshopStatus = useAppContext(
    (v) => v.requestHelpers.loadBuildWorkshopStatus
  );
  const persona = resolvePersona(partnerId);
  const canonicalUserId = Number(userId || 0);
  const shouldLoad = Boolean(
    enabled &&
      persona &&
      BUILD_WORKSHOP_PREVIEW_USER_IDS.has(canonicalUserId)
  );
  const [dialogueState, setDialogueState] =
    useState<LumineDialogueState | null>(null);

  useEffect(() => {
    let current = true;
    if (!shouldLoad || !persona) {
      setDialogueState(null);
      return () => {
        current = false;
      };
    }
    const activePersona = persona;
    void refreshFromServer();
    return () => {
      current = false;
    };

    async function refreshFromServer() {
      try {
        const status = await loadBuildWorkshopStatus({
          persona: activePersona
        });
        if (!current) return;
        replaceCanonicalDialogueState(
          setDialogueState,
          dialogueStateFromStatus({
            status,
            requesterUserId: canonicalUserId,
            persona: activePersona,
            selectedChannelId,
            topicId
          })
        );
      } catch {
        // Preserve the last canonical state through a transient request error.
      }
    }
  }, [
    canonicalUserId,
    persona,
    selectedChannelId,
    shouldLoad,
    topicId
  ]);

  useEffect(() => {
    if (!shouldLoad || !persona) return;
    const activePersona = persona;
    let current = true;

    function applyCanonicalDialogue(payload: unknown) {
      if (!current) return;
      const nextState = normalizeDialogueState(payload);
      if (
        !nextState ||
        nextState.requesterUserId !== canonicalUserId ||
        nextState.persona !== activePersona ||
        nextState.channelId !== selectedChannelId ||
        Number(nextState.topicId || 0) !== Number(topicId || 0)
      ) {
        return;
      }
      replaceCanonicalDialogueState(
        setDialogueState,
        ACTIVE_JOB_STATUSES.has(nextState.jobStatus) ? nextState : null
      );
    }

    function refreshAfterReconnect() {
      void loadBuildWorkshopStatus({ persona: activePersona })
        .then((status: unknown) => {
          if (!current) return;
          replaceCanonicalDialogueState(
            setDialogueState,
            dialogueStateFromStatus({
              status,
              requesterUserId: canonicalUserId,
              persona: activePersona,
              selectedChannelId,
              topicId
            })
          );
        })
        .catch(() => undefined);
    }

    socket.on('build_workshop_dialogue_updated', applyCanonicalDialogue);
    socket.on('connect', refreshAfterReconnect);
    return () => {
      current = false;
      socket.off('build_workshop_dialogue_updated', applyCanonicalDialogue);
      socket.off('connect', refreshAfterReconnect);
    };
  }, [
    canonicalUserId,
    persona,
    selectedChannelId,
    shouldLoad,
    topicId
  ]);

  useEffect(() => {
    if (!shouldLoad || !persona || !dialogueState?.jobId) return;
    const activePersona = persona;
    let current = true;
    const timer = window.setInterval(async () => {
      try {
        const status = await loadBuildWorkshopStatus({
          persona: activePersona
        });
        if (!current) return;
        replaceCanonicalDialogueState(
          setDialogueState,
          dialogueStateFromStatus({
            status,
            requesterUserId: canonicalUserId,
            persona: activePersona,
            selectedChannelId,
            topicId
          })
        );
      } catch {
        // Preserve the last canonical state through a transient request error.
      }
    }, POLL_MS);
    return () => {
      current = false;
      window.clearInterval(timer);
    };
  }, [
    canonicalUserId,
    dialogueState?.jobId,
    persona,
    selectedChannelId,
    shouldLoad,
    topicId
  ]);

  return shouldLoad ? dialogueState : null;
}

function replaceCanonicalDialogueState(
  setDialogueState: Dispatch<SetStateAction<LumineDialogueState | null>>,
  nextState: LumineDialogueState | null
) {
  setDialogueState((currentState) => {
    if (
      currentState &&
      nextState &&
      currentState.jobId === nextState.jobId &&
      latestDialogueId(nextState) < latestDialogueId(currentState)
    ) {
      return currentState;
    }
    return nextState;
  });
}

function latestDialogueId(state: LumineDialogueState) {
  return Number(state.dialogue[state.dialogue.length - 1]?.id || 0);
}

function resolvePersona(partnerId?: number): WorkshopPersona | null {
  if (Number(partnerId) === Number(CIEL_TWINKLE_ID)) return 'ciel';
  if (Number(partnerId) === Number(ZERO_TWINKLE_ID)) return 'zero';
  return null;
}

function dialogueStateFromStatus({
  status,
  requesterUserId,
  persona,
  selectedChannelId,
  topicId
}: {
  status: any;
  requesterUserId: number;
  persona: WorkshopPersona;
  selectedChannelId: number;
  topicId: number | null;
}): LumineDialogueState | null {
  const job = status?.job;
  if (
    !job ||
    !ACTIVE_JOB_STATUSES.has(String(job.status || '')) ||
    Number(job.channelId || 0) !== selectedChannelId ||
    Number(job.topicId || 0) !== Number(topicId || 0)
  ) {
    return null;
  }
  return normalizeDialogueState({
    requesterUserId,
    jobId: job.id,
    channelId: job.channelId,
    topicId: job.topicId,
    persona,
    jobStatus: job.status,
    canProgress: job.canProgress,
    dialogue: job.dialogue
  });
}

function normalizeDialogueState(value: any): LumineDialogueState | null {
  const requesterUserId = Number(value?.requesterUserId || 0);
  const jobId = Number(value?.jobId || 0);
  const channelId = Number(value?.channelId || 0);
  const persona = value?.persona;
  if (
    !requesterUserId ||
    !jobId ||
    !channelId ||
    (persona !== 'zero' && persona !== 'ciel') ||
    typeof value?.canProgress !== 'boolean' ||
    !Array.isArray(value?.dialogue)
  ) {
    return null;
  }
  const dialogue = value.dialogue
    .map(normalizeDialogueEntry)
    .filter(
      (
        entry: LumineDialogueEntry | null
      ): entry is LumineDialogueEntry => !!entry
    );
  return {
    requesterUserId,
    jobId,
    channelId,
    topicId: Number(value.topicId || 0) || null,
    persona,
    personaName: persona === 'ciel' ? 'Ciel' : 'Zero',
    jobStatus: String(value.jobStatus || ''),
    canProgress: value.canProgress,
    dialogue
  };
}

function normalizeDialogueEntry(value: any): LumineDialogueEntry | null {
  const id = Number(value?.id || 0);
  const direction = value?.direction;
  const message = String(value?.message || '');
  if (
    !id ||
    !message ||
    (direction !== 'persona_to_lumine' &&
      direction !== 'lumine_to_persona')
  ) {
    return null;
  }
  return {
    id,
    direction,
    speaker:
      direction === 'lumine_to_persona'
        ? 'Lumine'
        : value.speaker === 'Ciel'
          ? 'Ciel'
          : 'Zero',
    message,
    kind:
      direction === 'lumine_to_persona'
        ? 'progress'
        : value.kind === 'approved_follow_up'
          ? 'approved_follow_up'
          : 'approved_plan',
    phase: String(value.phase || '').trim() || null,
    createdAt: Number(value.createdAt || 0) || null
  };
}
