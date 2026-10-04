import type {
  BuildExecutionPlan,
  BuildExecutionPlanChunk,
  BuildPlanAction,
  BuildRoadmapSmallerOption
} from '../types';

// A Lumine Roadmap is the execution plan Lumine proposes when a request is
// far bigger than one sitting: milestones (kind 'big_chunk') the kid can play
// after each, with an honest Energy estimate in days. Everything the chat
// shows about it is derived here from the plan alone, so a reload, a second
// tab or a socket update all land on the same screen.

export type RoadmapPhase =
  // Lumine proposed a roadmap; nothing has started yet.
  | 'proposal'
  // A milestone is being built (or ready to keep going).
  | 'building'
  // A milestone just finished and the next one has not started.
  | 'milestone_done'
  // Every milestone is done.
  | 'complete';

export type RoadmapMilestoneState = 'done' | 'now' | 'pending';

export interface RoadmapStepView {
  id: string;
  title: string;
  done: boolean;
}

export interface RoadmapMilestoneView {
  id: string;
  number: number;
  title: string;
  summary: string;
  playable: string;
  // "a full match" from "You can play: a full match".
  playableOutcome: string;
  label: string;
  energyDays: number;
  state: RoadmapMilestoneState;
  started: boolean;
  steps: RoadmapStepView[];
  // Acceptance criteria as a checklist (ticked = the evaluator passed it).
  // When present the "Now building" card shows these instead of steps.
  criteria: RoadmapStepView[];
  // One friendly line when the evaluator says NEEDS_WORK ("Almost! …").
  fixingNote: string;
  completedAt: number | null;
}

export interface RoadmapView {
  key: string;
  buildId: number;
  updatedAt: number;
  title: string;
  summary: string;
  phase: RoadmapPhase;
  milestones: RoadmapMilestoneView[];
  total: number;
  doneCount: number;
  // The milestone being built, or the next one to start.
  current: RoadmapMilestoneView | null;
  // The most recently finished milestone (celebrated in milestone_done).
  lastDone: RoadmapMilestoneView | null;
  energyDays: number;
  daysLeft: number;
  smaller: BuildRoadmapSmallerOption | null;
  hardestNote: string;
  // "Next: …" from the latest run's hand-off note.
  nextNote: string;
  // The latest re-plan (shown once as "Build plan updated" + reason).
  replan: { at: number; reason: string } | null;
  // Lumine asked "stop the build plan?" after a typed stop (plan running).
  stopConfirm: { at: number; messageId: number } | null;
}

export type RoadmapAction =
  'start' | 'continue' | 'smaller' | 'skip' | 'cancel';

const MAX_MILESTONES = 8;
const MAX_STEPS = 5;

function cleanText(value: unknown, maxLength: number) {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function positiveNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function milestonesOf(plan: BuildExecutionPlan | null | undefined) {
  const chunks = Array.isArray(plan?.plan?.chunks) ? plan!.plan.chunks : [];
  return chunks.filter((chunk) => chunk?.kind === 'big_chunk');
}

export function isRoadmapPlan(
  plan: BuildExecutionPlan | null | undefined
): plan is BuildExecutionPlan {
  // Older scoped plans have no kind; only roadmaps say so.
  if (!plan?.plan || String(plan.plan.kind || '') !== 'roadmap') return false;
  return milestonesOf(plan).length > 0;
}

const PLAYABLE_PREFIX = /^\s*(you\s+can\s+play|play)\s*[:\-–—]\s*/i;

export function stripPlayablePrefix(playable: string) {
  return String(playable || '')
    .replace(PLAYABLE_PREFIX, '')
    .replace(/[.!\s]+$/, '')
    .trim();
}

export function formatPlayableLine(playable: string) {
  const outcome = stripPlayablePrefix(playable);
  return outcome ? `You can play: ${outcome}` : '';
}

const LEADING_FILLER = new Set([
  'a',
  'an',
  'the',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'add',
  'adding',
  'make',
  'build',
  'more',
  'some',
  'your',
  'new',
  'basic',
  'simple',
  'real'
]);

const LABEL_JOINERS = new Set([
  'that',
  'and',
  'to',
  'with',
  'for',
  'on',
  'of',
  'in',
  'a',
  'an',
  'the',
  'you',
  'who',
  'which',
  '%'
]);

// A short level-map label ("Stages", "8 fighters") from a milestone title,
// used only when the plan does not carry its own label.
export function deriveMilestoneLabel(title: string) {
  const words = String(title || '')
    .replace(/[^\p{L}\p{N}%'\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  let index = 0;
  while (
    index < words.length - 1 &&
    LEADING_FILLER.has(words[index].toLowerCase())
  ) {
    index += 1;
  }
  const first = words[index] || String(title || '').trim();
  const next = words[index + 1] || '';
  // Keep a number with its noun ("8 fighters") and short pairs ("Second
  // fighter", "Online battles"), never a dangling "that" or "and".
  const pair = `${first} ${next}`;
  let label =
    next &&
    !LABEL_JOINERS.has(next.toLowerCase()) &&
    (/^\d/.test(first) || pair.length <= 14)
      ? pair
      : first;
  if (label.length > 14) label = `${label.slice(0, 13)}…`;
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
}

function lowerFirst(text: string) {
  if (!text) return text;
  // Leave acronyms and names ("PvP", "AI") alone.
  if (/^[A-Z]{2}/.test(text)) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function stepsOf(milestone: BuildExecutionPlanChunk): RoadmapStepView[] {
  const steps = Array.isArray(milestone.chunks) ? milestone.chunks : [];
  return steps
    .filter((step) => step && step.status !== 'cancelled')
    .slice(0, MAX_STEPS)
    .map((step, index) => ({
      id: String(step.id || `step-${index}`),
      title: cleanText(step.title, 60),
      done: step.status === 'completed'
    }))
    .filter((step) => step.title);
}

function criteriaOf(milestone: BuildExecutionPlanChunk): RoadmapStepView[] {
  const raw = Array.isArray(milestone.acceptanceCriteria)
    ? milestone.acceptanceCriteria
    : [];
  const milestoneDone = milestone.status === 'completed';
  return raw
    .map((entry, index) => {
      const isText = typeof entry === 'string';
      const text = cleanText(isText ? entry : entry?.text, 90);
      return {
        id: String((!isText && entry?.id) || `criterion-${index}`),
        title: text,
        done: milestoneDone || (!isText && entry?.passes === true)
      };
    })
    .filter((criterion) => criterion.title)
    .slice(0, 6);
}

function fixingNoteOf(milestone: BuildExecutionPlanChunk) {
  const evaluation = milestone.evaluation;
  if (milestone.status === 'completed') return '';
  if (String(evaluation?.verdict || '').toUpperCase() !== 'NEEDS_WORK') {
    return '';
  }
  const findings = Array.isArray(evaluation?.findings)
    ? evaluation!.findings
    : [];
  const first = findings
    .map((finding) =>
      cleanText(typeof finding === 'string' ? finding : finding?.text, 110)
    )
    .find(Boolean);
  return first
    ? `Almost! Lumine is fixing: ${lowerFirst(first.replace(/[.!\s]+$/, ''))}`
    : 'Almost! Lumine is fixing a few things.';
}

// "Next: add the lava stage" from a hand-off note ("Next: …" or plain).
export function formatHandoffNext(note: unknown) {
  const text = cleanText(note, 140)
    .replace(/^\s*next\s*[:\-–—]\s*/i, '')
    .trim();
  return text ? `Next: ${text}` : '';
}

function latestReplanOf(plan: BuildExecutionPlan) {
  const replans = Array.isArray(plan.plan.replans) ? plan.plan.replans : [];
  let latest: { at: number; reason: string } | null = null;
  for (const entry of replans) {
    const at = Number(entry?.at) || 0;
    const reason = cleanText(entry?.reason, 160).replace(/[.!\s]+$/, '');
    if (!at || !reason) continue;
    if (!latest || at >= latest.at) latest = { at, reason };
  }
  return latest;
}

// The "Build plan updated" notice shows once per re-plan, until dismissed.
export function resolveReplanNotice(
  view: RoadmapView | null,
  memory?: RoadmapUiMemory | null
) {
  if (!view?.replan) return null;
  if (Number(memory?.replanSeenAt || 0) >= view.replan.at) return null;
  return view.replan;
}

export function resolveRoadmapView(
  plan: BuildExecutionPlan | null | undefined,
  options: { generating?: boolean } = {}
): RoadmapView | null {
  if (!isRoadmapPlan(plan)) return null;
  if (plan.status === 'cancelled') return null;
  const rawMilestones = milestonesOf(plan)
    .filter((milestone) => milestone.status !== 'cancelled')
    .slice(0, MAX_MILESTONES);
  if (rawMilestones.length === 0) return null;

  const currentIndexFromPlan = rawMilestones.findIndex(
    (milestone) =>
      milestone.id === plan.currentBigChunkId &&
      milestone.status !== 'completed'
  );
  const firstOpenIndex = rawMilestones.findIndex(
    (milestone) => milestone.status !== 'completed'
  );
  const currentIndex =
    currentIndexFromPlan >= 0 ? currentIndexFromPlan : firstOpenIndex;

  const milestones: RoadmapMilestoneView[] = rawMilestones.map(
    (milestone, index) => {
      const steps = stepsOf(milestone);
      const done = milestone.status === 'completed';
      const playable = cleanText(milestone.playable, 120);
      const title = cleanText(milestone.title, 70);
      return {
        id: String(milestone.id || `milestone-${index}`),
        number: index + 1,
        title,
        summary: cleanText(milestone.summary, 200),
        playable,
        playableOutcome: stripPlayablePrefix(playable),
        label: cleanText(milestone.label, 14) || deriveMilestoneLabel(title),
        energyDays: roundToHalf(positiveNumber(milestone.energyDays)),
        state: done ? 'done' : index === currentIndex ? 'now' : 'pending',
        started:
          done ||
          milestone.status === 'in_progress' ||
          (Array.isArray(milestone.chunks) &&
            milestone.chunks.some(
              (step) =>
                step?.status === 'completed' || step?.status === 'in_progress'
            )),
        steps,
        criteria: criteriaOf(milestone),
        fixingNote: fixingNoteOf(milestone),
        completedAt:
          positiveNumber(milestone.completedAt) > 0
            ? Number(milestone.completedAt)
            : null
      };
    }
  );

  const doneCount = milestones.filter((m) => m.state === 'done').length;
  const total = milestones.length;
  const current = currentIndex >= 0 ? milestones[currentIndex] || null : null;
  const doneMilestones = milestones.filter((m) => m.state === 'done');
  const lastDone =
    doneMilestones.length > 0
      ? doneMilestones.reduce((latest, milestone) =>
          (milestone.completedAt || 0) > (latest.completedAt || 0) ||
          ((milestone.completedAt || 0) === (latest.completedAt || 0) &&
            milestone.number > latest.number)
            ? milestone
            : latest
        )
      : null;

  const planEnergyDays = roundToHalf(positiveNumber(plan.plan.energyDays));
  const milestoneEnergyTotal = milestones.reduce(
    (sum, milestone) => sum + milestone.energyDays,
    0
  );
  const energyDays = planEnergyDays || roundToHalf(milestoneEnergyTotal);
  const remainingByMilestones = milestones
    .filter((milestone) => milestone.state !== 'done')
    .reduce((sum, milestone) => sum + milestone.energyDays, 0);
  const daysLeft =
    milestoneEnergyTotal > 0
      ? roundToHalf(remainingByMilestones)
      : roundToHalf(energyDays * ((total - doneCount) / Math.max(1, total)));

  let phase: RoadmapPhase;
  if (plan.status === 'completed' || doneCount === total) {
    phase = 'complete';
  } else if (doneCount === 0 && plan.status === 'awaiting_confirmation') {
    phase = 'proposal';
  } else if (
    doneCount > 0 &&
    !options.generating &&
    current &&
    !current.started
  ) {
    phase = 'milestone_done';
  } else {
    phase = 'building';
  }

  return {
    key: `${plan.buildId}:${plan.createdAt}`,
    buildId: Number(plan.buildId) || 0,
    updatedAt: Number(plan.updatedAt) || 0,
    title:
      cleanText(plan.plan.title, 40) ||
      cleanText(plan.summary || plan.plan.summary, 40) ||
      'Your game',
    summary: cleanText(plan.plan.summary || plan.summary, 200),
    phase,
    milestones,
    total,
    doneCount,
    current,
    lastDone,
    energyDays,
    daysLeft,
    smaller:
      plan.plan.smaller &&
      String(plan.plan.smaller.label || '').trim() &&
      String(plan.plan.smaller.request || '').trim()
        ? {
            label: cleanText(plan.plan.smaller.label, 60),
            request: String(plan.plan.smaller.request).trim()
          }
        : null,
    hardestNote: cleanText(plan.plan.hardestNote, 200),
    nextNote: formatHandoffNext(plan.plan.handoffNote),
    replan: latestReplanOf(plan),
    stopConfirm:
      plan.status === 'running' &&
      positiveNumber(plan.plan.pendingStopConfirmAt) > 0
        ? {
            at: Number(plan.plan.pendingStopConfirmAt),
            messageId: Number(plan.plan.pendingStopConfirmMessageId) || 0
          }
        : null
  };
}

// "6 days", "1.5 days", "a day", "half a day".
export function formatEnergyDays(days: number) {
  const rounded = roundToHalf(positiveNumber(days));
  if (rounded <= 0.5) return 'half a day';
  if (rounded === 1) return 'a day';
  return `${rounded} days`;
}

export function formatRoadmapEnergyTotal(days: number) {
  return `about ${formatEnergyDays(days)} of Energy`;
}

export function formatRoadmapDaysLeft(days: number) {
  return `~${formatEnergyDays(days)} left`;
}

// "+ 4 more: stages, 8 fighters, menus, online battles"
export function formatMoreMilestones(
  milestones: RoadmapMilestoneView[],
  shown: number
) {
  const rest = milestones.slice(shown);
  if (rest.length === 0) return '';
  const names = rest.map((milestone) => lowerFirst(milestone.label));
  return `+ ${rest.length} more: ${names.join(', ')}`;
}

export function formatMilestoneDoneTitle(milestone: RoadmapMilestoneView) {
  const outcome = milestone.playableOutcome || lowerFirst(milestone.title);
  return `Milestone ${milestone.number} done: ${outcome}!`;
}

export function formatNextMilestoneRibbon(view: RoadmapView) {
  const progress = `${view.doneCount} of ${view.total}`;
  return view.current
    ? `${progress} · next: ${lowerFirst(view.current.title)}`
    : progress;
}

// The one place roadmap buttons become a Lumine request: the visible chat
// line the kid "says", plus the plan action the server acts on. Kept tiny so
// the transport can follow the API without touching the components.
export function resolveRoadmapActionRequest(
  action: RoadmapAction,
  view: RoadmapView | null
): { message: string; planAction: BuildPlanAction } | null {
  if (!view) return null;
  switch (action) {
    case 'start': {
      const number = view.current?.number || 1;
      // Accepting the proposal starts the roadmap; starting a later
      // milestone continues the running one.
      return {
        message: `Start milestone ${number}`,
        planAction: view.phase === 'proposal' ? 'start' : 'continue'
      };
    }
    case 'continue':
      return { message: 'Keep going', planAction: 'continue' };
    case 'smaller':
      return view.smaller
        ? { message: view.smaller.label, planAction: 'smaller' }
        : null;
    case 'skip':
      return { message: 'Just build it, no plan', planAction: 'skip' };
    case 'cancel':
      return { message: 'Stop the build plan', planAction: 'cancel' };
    default:
      return null;
  }
}

export interface RoadmapUiMemory {
  // Milestone id whose "start the next one?" offer the kid put off.
  offerDismissedFor?: string | null;
  // The finished roadmap was closed.
  closed?: boolean;
  // The newest re-plan whose "Build plan updated" notice was dismissed.
  replanSeenAt?: number | null;
  // "Keep it" on a stop confirmation (its pendingStopConfirmAt).
  stopConfirmDismissedAt?: number | null;
  collapsed?: boolean;
}

export interface RoadmapSurfaces {
  // The pinned roadmap panel above the chat.
  panel: boolean;
  // A one-line "Your roadmap is ready" strip in the panel slot, for an open
  // proposal whose card has stepped aside, so Start is always reachable.
  strip: boolean;
  // The card at the end of the chat transcript.
  transcriptCard:
    'proposal' | 'celebration' | 'complete' | 'stop_confirm' | null;
}

// One status surface at a time: the proposal card, the celebration, the
// finished card, or the pinned panel, never two of them saying the same thing.
export function resolveRoadmapSurfaces(
  view: RoadmapView | null,
  {
    generating,
    memory,
    latestUserMessageAt = 0,
    proposalAnswered = false,
    proposalOpened = false,
    stopConfirmAnswered = false
  }: {
    // The kid wrote again after Lumine's "stop the build plan?" question.
    stopConfirmAnswered?: boolean;
    generating: boolean;
    memory?: RoadmapUiMemory | null;
    // The kid wrote again after the proposal (resolveProposalAnswered).
    proposalAnswered?: boolean;
    // They pressed "View" on the strip to bring the card back.
    proposalOpened?: boolean;
    // Unix seconds of the kid's newest chat message: once they have moved
    // on (typed something, or pressed a roadmap button), cards that sit at
    // the end of the chat step aside.
    latestUserMessageAt?: number;
  }
): RoadmapSurfaces {
  const none: RoadmapSurfaces = {
    panel: false,
    strip: false,
    transcriptCard: null
  };
  if (!view) return none;
  const panel: RoadmapSurfaces = { ...none, panel: true };
  const card = (
    transcriptCard: RoadmapSurfaces['transcriptCard']
  ): RoadmapSurfaces => ({ ...none, transcriptCard });
  const movedOnSince = (time: number | null | undefined) =>
    Boolean(time) && Number(latestUserMessageAt) > Number(time);
  // A typed stop on a running plan: Lumine's confirm question gets its two
  // buttons right under it (the plan is still running, so the panel stays).
  if (
    view.stopConfirm &&
    !generating &&
    !stopConfirmAnswered &&
    Number(memory?.stopConfirmDismissedAt || 0) < view.stopConfirm.at
  ) {
    return { ...panel, transcriptCard: 'stop_confirm' };
  }
  switch (view.phase) {
    case 'proposal':
      // Only the server (status cancelled) retires a proposal. While it is
      // open there is always a way to act: the card under Lumine's proposal
      // message, or, once the chat has moved on, the compact strip.
      return generating || (proposalAnswered && !proposalOpened)
        ? { ...none, strip: true }
        : card('proposal');
    case 'milestone_done':
      if (
        (memory?.offerDismissedFor &&
          memory.offerDismissedFor === view.lastDone?.id) ||
        movedOnSince(view.lastDone?.completedAt)
      ) {
        return panel;
      }
      return card('celebration');
    case 'complete':
      return memory?.closed ||
        generating ||
        movedOnSince(view.lastDone?.completedAt)
        ? none
        : card('complete');
    case 'building':
    default:
      return panel;
  }
}

// While Lumine's checker grades a milestone against its acceptance criteria
// the run reports phase 'roadmap_check'; the run-status line names it simply.
export const ROADMAP_CHECK_PHASE = 'roadmap_check';
export const ROADMAP_CHECK_STATUS_LABEL = 'Checking your milestone…';

export function resolveRoadmapCheckActivity({
  runEvents,
  generatingStatus
}: {
  runEvents: Array<{ phase?: string | null } | null | undefined>;
  generatingStatus?: string | null;
}) {
  for (let index = runEvents.length - 1; index >= 0; index -= 1) {
    const phase = String(runEvents[index]?.phase || '').trim();
    if (!phase) continue;
    return phase === ROADMAP_CHECK_PHASE ? ROADMAP_CHECK_STATUS_LABEL : '';
  }
  return String(generatingStatus || '').trim() === ROADMAP_CHECK_PHASE
    ? ROADMAP_CHECK_STATUS_LABEL
    : '';
}

// While a roadmap is running, its own buttons are the next-step offer: the
// generic follow-up bubble never shows alongside. Energy stops are the
// exception (a lighter-model switch, or "continue after recharging"): they
// are about Energy, not the next feature, so they always stay. A proposal
// does not hold follow-ups back: typing a new request declines it.
export function roadmapHidesFollowUp(
  plan: BuildExecutionPlan | null | undefined,
  followUpPrompt:
    { modelSwitch?: unknown; mode?: string | null } | null | undefined
) {
  if (!isRoadmapPlan(plan) || plan.status !== 'running') return false;
  if (!followUpPrompt) return false;
  if (followUpPrompt.modelSwitch) return false;
  if (followUpPrompt.mode === 'continue_unfinished_work') return false;
  return true;
}

interface ProposalChatMessage {
  id?: number | string | null;
  role?: string | null;
  createdAt?: number | null;
  source?: string | null;
}

// Has the kid written again since Lumine proposed this roadmap? Decided by
// message ORDER after the proposal's own assistant message (never by
// comparing clocks with plan.updatedAt: the reply-only path stores the
// proposal message a second after the plan, and a question answered by
// chat leaves the proposal open). The proposal message is
// plan.proposalMessageId when the API sends it, else the assistant message
// closest in time to the plan's creation.
export function resolveProposalAnswered(
  messages: ProposalChatMessage[],
  plan: BuildExecutionPlan | null | undefined
) {
  if (!plan) return false;
  return resolveRepliedAfter(messages, {
    messageId: Number(plan.plan?.proposalMessageId || 0),
    at: Number(plan.createdAt) || 0
  });
}

// Has the kid replied to Lumine's "stop the build plan?" question?
export function resolveStopConfirmAnswered(
  messages: ProposalChatMessage[],
  view: RoadmapView | null
) {
  if (!view?.stopConfirm) return false;
  return resolveRepliedAfter(messages, view.stopConfirm);
}

// Is there a user message after the given assistant message (by id, else
// the assistant message closest in time to `at`)? Order, not clocks.
function resolveRepliedAfter(
  messages: ProposalChatMessage[],
  anchor: { messageId: number; at: number }
) {
  const chat = (Array.isArray(messages) ? messages : []).filter(
    (message) =>
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      message.source !== 'runtime_observation'
  );
  let anchorIndex =
    anchor.messageId > 0
      ? chat.findIndex(
          (message) =>
            message.role === 'assistant' &&
            Number(message.id) === anchor.messageId
        )
      : -1;
  if (anchorIndex < 0) {
    const createdAt = anchor.at;
    let bestDistance = Infinity;
    chat.forEach((message, index) => {
      if (message.role !== 'assistant') return;
      const distance = Math.abs((Number(message.createdAt) || 0) - createdAt);
      if (distance <= bestDistance) {
        bestDistance = distance;
        anchorIndex = index;
      }
    });
  }
  if (anchorIndex < 0) return false;
  return chat.slice(anchorIndex + 1).some((message) => message.role === 'user');
}
