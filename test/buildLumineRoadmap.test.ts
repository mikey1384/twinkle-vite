import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveMilestoneLabel,
  formatEnergyDays,
  formatMilestoneDoneTitle,
  formatMoreMilestones,
  formatNextMilestoneRibbon,
  formatPlayableLine,
  isRoadmapPlan,
  resolveRoadmapActionRequest,
  resolveRoadmapSurfaces,
  resolveRoadmapView,
  resolveRoadmapCheckActivity,
  roadmapHidesFollowUp,
  resolveProposalAnswered,
  resolveReplanNotice,
  resolveStopConfirmAnswered
} from '../src/containers/Build/Editor/helpers/roadmap';

type Status = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

const MILESTONES: Array<[string, string, string]> = [
  [
    'One fighter that runs, jumps and punches',
    'You can play: move around a stage',
    'Fighter'
  ],
  [
    'A second fighter and knockbacks',
    'You can play: 1v1 on one keyboard',
    '1v1'
  ],
  ['Damage %, ring-outs and lives', 'You can play: a full match', 'Match'],
  ['Three stages to fight on', 'You can play: pick a stage', 'Stages'],
  ['8 fighters to pick from', 'You can play: any of 8 fighters', '8 fighters'],
  [
    'Menus and a title screen',
    'You can play: the whole game from the menu',
    'Menus'
  ],
  ['Online battles', 'You can play: against a friend online', 'Online']
];

function roadmapPlan({
  status = 'awaiting_confirmation',
  done = 0,
  currentSteps = ['pending', 'pending', 'pending'] as Status[],
  current = done,
  withLabels = true
}: {
  status?: 'awaiting_confirmation' | 'running' | 'completed' | 'cancelled';
  done?: number;
  currentSteps?: Status[];
  current?: number;
  withLabels?: boolean;
} = {}) {
  const chunks = MILESTONES.map(([title, playable, label], index) => ({
    id: `m${index + 1}`,
    kind: 'big_chunk' as const,
    title,
    summary: index === 2 ? 'Damage %, ring-outs and 3 lives each.' : '',
    playable,
    label: withLabels ? label : null,
    energyDays: 1,
    completedAt: index < done ? 1000 + index : null,
    status: (index < done
      ? 'completed'
      : index === current &&
          status === 'running' &&
          currentSteps.some((s) => s !== 'pending')
        ? 'in_progress'
        : 'pending') as Status,
    chunks: ['Step A', 'Step B', 'Step C'].map((stepTitle, stepIndex) => ({
      id: `m${index + 1}s${stepIndex + 1}`,
      kind: 'chunk' as const,
      title: stepTitle,
      summary: '',
      status: (index < done
        ? 'completed'
        : index === current
          ? currentSteps[stepIndex]
          : 'pending') as Status,
      chunks: []
    }))
  }));
  return {
    buildId: 42,
    mode: 'large' as const,
    status,
    summary: 'A platform fighter',
    plan: {
      version: 1 as const,
      mode: 'large' as const,
      kind: 'roadmap',
      summary: 'A platform fighter',
      handoffNote: null as string | null,
      title: 'Platform Brawl',
      energyDays: 6,
      smaller: {
        label: 'Make it smaller, a 2-fighter game',
        request: 'make a 2-fighter platform game'
      },
      hardestNote: 'Online battles come last: they’re the hardest part.',
      chunks
    },
    currentBigChunkId: `m${current + 1}`,
    currentChunkId: null,
    createdByUserId: 1,
    createdAt: 500,
    updatedAt: 900
  };
}

test('only plans marked kind roadmap count as a roadmap', () => {
  assert.equal(isRoadmapPlan(roadmapPlan()), true);
  const legacy = roadmapPlan();
  delete (legacy.plan as any).kind;
  assert.equal(isRoadmapPlan(legacy), false);
  const flatChunks = roadmapPlan();
  flatChunks.plan.chunks = flatChunks.plan.chunks.map((chunk) => ({
    ...chunk,
    kind: 'chunk' as any
  }));
  assert.equal(isRoadmapPlan(flatChunks), false);
  assert.equal(isRoadmapPlan(null), false);
});

test('a fresh roadmap is a proposal with the first milestone up', () => {
  const view = resolveRoadmapView(roadmapPlan())!;
  assert.equal(view.phase, 'proposal');
  assert.equal(view.title, 'Platform Brawl');
  assert.equal(view.total, 7);
  assert.equal(view.doneCount, 0);
  assert.equal(view.current?.number, 1);
  assert.equal(view.energyDays, 6);
  assert.equal(
    formatMoreMilestones(view.milestones, 3),
    '+ 4 more: stages, 8 fighters, menus, online'
  );
  // Playable text arrives without the prefix; both forms read the same.
  assert.equal(view.current?.playableOutcome, 'move around a stage');
  assert.deepEqual(resolveRoadmapSurfaces(view, { generating: false }), {
    panel: false,
    strip: false,
    transcriptCard: 'proposal'
  });
});

test('building shows only the panel, with progress and days left', () => {
  const view = resolveRoadmapView(
    roadmapPlan({
      status: 'running',
      done: 3,
      currentSteps: ['completed', 'completed', 'in_progress']
    }),
    { generating: true }
  )!;
  assert.equal(view.phase, 'building');
  assert.equal(view.doneCount, 3);
  assert.equal(view.current?.title, 'Three stages to fight on');
  assert.deepEqual(
    view.current?.steps.map((step) => step.done),
    [true, true, false]
  );
  assert.equal(view.daysLeft, 4);
  assert.deepEqual(
    view.milestones.map((milestone) => milestone.state),
    ['done', 'done', 'done', 'now', 'pending', 'pending', 'pending']
  );
  assert.deepEqual(resolveRoadmapSurfaces(view, { generating: true }), {
    panel: true,
    strip: false,
    transcriptCard: null
  });
});

test('a just-finished milestone is celebrated until started or put off', () => {
  const plan = roadmapPlan({ status: 'running', done: 3 });
  const view = resolveRoadmapView(plan, { generating: false })!;
  assert.equal(view.phase, 'milestone_done');
  assert.equal(view.lastDone?.number, 3);
  assert.equal(
    formatMilestoneDoneTitle(view.lastDone!),
    'Milestone 3 done: a full match!'
  );
  assert.equal(
    formatNextMilestoneRibbon(view),
    '3 of 7 · next: three stages to fight on'
  );
  assert.deepEqual(resolveRoadmapSurfaces(view, { generating: false }), {
    panel: false,
    strip: false,
    transcriptCard: 'celebration'
  });
  // "Tomorrow" folds the offer into the panel's "Up next" card.
  assert.deepEqual(
    resolveRoadmapSurfaces(view, {
      generating: false,
      memory: { offerDismissedFor: 'm3' }
    }),
    { panel: true, strip: false, transcriptCard: null }
  );
  // A run on the next milestone is building, not celebrating.
  assert.equal(
    resolveRoadmapView(plan, { generating: true })!.phase,
    'building'
  );
  // The server may wait for confirmation between milestones too.
  assert.equal(
    resolveRoadmapView(
      roadmapPlan({ status: 'awaiting_confirmation', done: 3 })
    )!.phase,
    'milestone_done'
  );
});

test('a finished roadmap shows the trophy card until closed', () => {
  const view = resolveRoadmapView(
    roadmapPlan({ status: 'completed', done: 7 })
  )!;
  assert.equal(view.phase, 'complete');
  assert.equal(view.current, null);
  assert.equal(view.daysLeft, 0);
  assert.deepEqual(resolveRoadmapSurfaces(view, { generating: false }), {
    panel: false,
    strip: false,
    transcriptCard: 'complete'
  });
  assert.deepEqual(
    resolveRoadmapSurfaces(view, {
      generating: false,
      memory: { closed: true }
    }),
    { panel: false, strip: false, transcriptCard: null }
  );
});

test('a cancelled roadmap shows nothing', () => {
  assert.equal(resolveRoadmapView(roadmapPlan({ status: 'cancelled' })), null);
  assert.deepEqual(resolveRoadmapSurfaces(null, { generating: false }), {
    panel: false,
    strip: false,
    transcriptCard: null
  });
});

test('buttons map to the visible chat line and the plan action', () => {
  const proposal = resolveRoadmapView(roadmapPlan());
  assert.deepEqual(resolveRoadmapActionRequest('start', proposal), {
    message: 'Start milestone 1',
    planAction: 'start'
  });
  assert.deepEqual(resolveRoadmapActionRequest('smaller', proposal), {
    message: 'Make it smaller, a 2-fighter game',
    planAction: 'smaller'
  });
  assert.deepEqual(resolveRoadmapActionRequest('skip', proposal), {
    message: 'Just build it, no plan',
    planAction: 'skip'
  });
  const between = resolveRoadmapView(
    roadmapPlan({ status: 'running', done: 3 })
  );
  assert.deepEqual(resolveRoadmapActionRequest('start', between), {
    message: 'Start milestone 4',
    planAction: 'continue'
  });
  assert.deepEqual(resolveRoadmapActionRequest('continue', between), {
    message: 'Keep going',
    planAction: 'continue'
  });
  const noSmaller = roadmapPlan();
  noSmaller.plan.smaller = null as any;
  assert.equal(
    resolveRoadmapActionRequest('smaller', resolveRoadmapView(noSmaller)),
    null
  );
  assert.equal(resolveRoadmapActionRequest('start', null), null);
});

test('energy, playable and label formatting', () => {
  assert.equal(formatEnergyDays(6), '6 days');
  assert.equal(formatEnergyDays(1), 'a day');
  assert.equal(formatEnergyDays(0.4), 'half a day');
  assert.equal(formatEnergyDays(1.26), '1.5 days');
  assert.equal(
    formatPlayableLine('You can play: a full match.'),
    'You can play: a full match'
  );
  assert.equal(
    formatPlayableLine('a full match'),
    'You can play: a full match'
  );
  assert.equal(formatPlayableLine(''), '');
  assert.equal(deriveMilestoneLabel('Three stages to fight on'), 'Stages');
  assert.equal(deriveMilestoneLabel('8 fighters to pick from'), '8 fighters');
  assert.equal(deriveMilestoneLabel('Online battles'), 'Online battles');
  assert.equal(deriveMilestoneLabel('One fighter that runs'), 'Fighter');
  assert.equal(deriveMilestoneLabel('A'), 'A');
  // Without plan labels the map derives them from titles.
  const view = resolveRoadmapView(roadmapPlan({ withLabels: false }))!;
  assert.deepEqual(
    view.milestones.map((milestone) => milestone.label),
    [
      'Fighter',
      'Second fighter',
      'Damage',
      'Stages',
      '8 fighters',
      'Menus',
      'Online battles'
    ]
  );
});

test('acceptance criteria replace steps; NEEDS_WORK and hand-off read kindly', () => {
  const plan = roadmapPlan({
    status: 'running',
    done: 3,
    currentSteps: ['completed', 'in_progress', 'pending']
  });
  (plan.plan.chunks[3] as any).acceptanceCriteria = [
    { id: 'c1', text: 'You can pick one of three stages', passes: true },
    { id: 'c2', text: 'Standing in lava takes damage', passes: false },
    'Platforms can be jumped through from below'
  ];
  (plan.plan.chunks[3] as any).evaluation = {
    verdict: 'NEEDS_WORK',
    findings: [{ text: 'Lava does no damage yet.' }]
  };
  plan.plan.handoffNote = 'Next: make the lava hurt';
  const view = resolveRoadmapView(plan, { generating: false })!;
  assert.deepEqual(
    view.current?.criteria.map((c) => [c.title, c.done]),
    [
      ['You can pick one of three stages', true],
      ['Standing in lava takes damage', false],
      ['Platforms can be jumped through from below', false]
    ]
  );
  assert.equal(
    view.current?.fixingNote,
    'Almost! Lumine is fixing: lava does no damage yet'
  );
  assert.equal(view.nextNote, 'Next: make the lava hurt');
  // Finished milestones count every criterion as passed and drop the note.
  (plan.plan.chunks[0] as any).acceptanceCriteria = ['Runs and jumps'];
  (plan.plan.chunks[0] as any).evaluation = {
    verdict: 'NEEDS_WORK',
    findings: ['old']
  };
  const first = resolveRoadmapView(plan)!.milestones[0];
  assert.equal(first.criteria[0].done, true);
  assert.equal(first.fixingNote, '');
});

test('cards at the end of the chat step aside once the kid moves on', () => {
  const proposal = resolveRoadmapView(roadmapPlan())!;
  // A newer user message alone never hides an open proposal (clock skew, or
  // a question answered by chat); only message order after the proposal
  // message folds the card into the strip.
  assert.equal(
    resolveRoadmapSurfaces(proposal, {
      generating: false,
      latestUserMessageAt: 901
    }).transcriptCard,
    'proposal'
  );
  const between = resolveRoadmapView(
    roadmapPlan({ status: 'running', done: 3 })
  )!;
  // Milestone 3 completed at 1002; a newer message folds the offer into the panel.
  assert.deepEqual(
    resolveRoadmapSurfaces(between, {
      generating: false,
      latestUserMessageAt: 1003
    }),
    { panel: true, strip: false, transcriptCard: null }
  );
  assert.deepEqual(resolveRoadmapActionRequest('cancel', between), {
    message: 'Stop the build plan',
    planAction: 'cancel'
  });
});

test('the checker phase reads kindly in the run-status line', () => {
  assert.equal(
    resolveRoadmapCheckActivity({
      runEvents: [
        { phase: 'workspace' },
        { phase: 'roadmap_check' },
        { phase: null }
      ]
    }),
    'Checking your milestone…'
  );
  assert.equal(
    resolveRoadmapCheckActivity({
      runEvents: [{ phase: 'roadmap_check' }, { phase: 'completed' }]
    }),
    ''
  );
  assert.equal(
    resolveRoadmapCheckActivity({
      runEvents: [],
      generatingStatus: 'roadmap_check'
    }),
    'Checking your milestone…'
  );
});

test('a running roadmap replaces generic follow-ups but never Energy stops', () => {
  const generic = {
    question: 'Add a boss?',
    suggestedMessage: 'Add a boss',
    mode: 'feature'
  };
  const running = roadmapPlan({ status: 'running', done: 2 }) as any;
  assert.equal(roadmapHidesFollowUp(running, generic), true);
  // Energy stops stay: a lighter-model switch, or continue after recharging.
  assert.equal(
    roadmapHidesFollowUp(running, {
      ...generic,
      modelSwitch: { model: 'm', mode: 'light', label: 'Light' }
    }),
    false
  );
  assert.equal(
    roadmapHidesFollowUp(running, {
      ...generic,
      mode: 'continue_unfinished_work'
    }),
    false
  );
  // A proposal (declined by typing), a finished, cancelled or legacy plan
  // leaves normal follow-ups alone.
  assert.equal(roadmapHidesFollowUp(roadmapPlan() as any, generic), false);
  assert.equal(
    roadmapHidesFollowUp(
      roadmapPlan({ status: 'completed', done: 7 }) as any,
      generic
    ),
    false
  );
  assert.equal(
    roadmapHidesFollowUp(roadmapPlan({ status: 'cancelled' }) as any, generic),
    false
  );
  const legacy = roadmapPlan({ status: 'running', done: 2 });
  delete (legacy.plan as any).kind;
  assert.equal(roadmapHidesFollowUp(legacy as any, generic), false);
  assert.equal(roadmapHidesFollowUp(null, generic), false);
  assert.equal(roadmapHidesFollowUp(running, null), false);
  // A cancelled (declined) proposal renders nothing at all.
  assert.deepEqual(
    resolveRoadmapSurfaces(
      resolveRoadmapView(roadmapPlan({ status: 'cancelled' })),
      { generating: false }
    ),
    { panel: false, strip: false, transcriptCard: null }
  );
});

test('an open proposal always keeps a way to act', () => {
  // plan.createdAt is 500 in the fixture.
  const plan = roadmapPlan() as any;
  const view = resolveRoadmapView(plan)!;
  const proposalTurn = [
    { id: 1, role: 'user', createdAt: 499 },
    // Reply-only path: stored a second after the plan.
    { id: 2, role: 'assistant', createdAt: 501 }
  ];
  // (B) after reload the message that created the proposal does not hide it.
  assert.equal(resolveProposalAnswered(proposalTurn, plan), false);
  assert.deepEqual(
    resolveRoadmapSurfaces(view, {
      generating: false,
      latestUserMessageAt: 499,
      proposalAnswered: resolveProposalAnswered(proposalTurn, plan)
    }),
    { panel: false, strip: false, transcriptCard: 'proposal' }
  );
  // (A) a question answered by chat: the card steps aside into the strip.
  const askedQuestion = [
    ...proposalTurn,
    { id: 3, role: 'user', createdAt: 600 },
    { id: 4, role: 'assistant', createdAt: 610 },
    { id: 5, role: 'assistant', createdAt: 611, source: 'runtime_observation' }
  ];
  assert.equal(resolveProposalAnswered(askedQuestion, plan), true);
  assert.deepEqual(
    resolveRoadmapSurfaces(view, { generating: false, proposalAnswered: true }),
    { panel: false, strip: true, transcriptCard: null }
  );
  // "View" brings the card back.
  assert.deepEqual(
    resolveRoadmapSurfaces(view, {
      generating: false,
      proposalAnswered: true,
      proposalOpened: true
    }),
    { panel: false, strip: false, transcriptCard: 'proposal' }
  );
  // While a run is going the strip stays (nothing vanishes mid-reply).
  assert.deepEqual(resolveRoadmapSurfaces(view, { generating: true }), {
    panel: false,
    strip: true,
    transcriptCard: null
  });
  // proposalMessageId wins over timing when the API sends it.
  const withId = roadmapPlan() as any;
  withId.plan.proposalMessageId = 4;
  assert.equal(resolveProposalAnswered(askedQuestion, withId), false);
  // No assistant message yet: keep the card.
  assert.equal(
    resolveProposalAnswered([{ id: 1, role: 'user', createdAt: 1 }], plan),
    false
  );
  // Only the server's cancelled status retires it.
  assert.equal(resolveRoadmapView(roadmapPlan({ status: 'cancelled' })), null);
});

test('a re-plan shows "Build plan updated" once, until dismissed', () => {
  const plan = roadmapPlan({ status: 'running', done: 2 }) as any;
  assert.equal(resolveReplanNotice(resolveRoadmapView(plan), {}), null);
  plan.plan.replans = [
    { at: 700, reason: 'Old reason', fromMilestoneIndex: 3 },
    {
      at: 800,
      reason: 'Online battles moved later so the stages come first.',
      fromMilestoneIndex: 3
    }
  ];
  const view = resolveRoadmapView(plan)!;
  assert.deepEqual(resolveReplanNotice(view, {}), {
    at: 800,
    reason: 'Online battles moved later so the stages come first'
  });
  assert.equal(resolveReplanNotice(view, { replanSeenAt: 800 }), null);
  // A newer re-plan shows again.
  plan.plan.replans.push({
    at: 900,
    reason: 'Added a boss',
    fromMilestoneIndex: 4
  });
  assert.equal(
    resolveReplanNotice(resolveRoadmapView(plan), { replanSeenAt: 800 })
      ?.reason,
    'Added a boss'
  );
});

test('an amended proposal replaces the card under its new message', () => {
  const amended = roadmapPlan() as any;
  amended.createdAt = 700;
  amended.plan.proposalMessageId = 6;
  const chat = [
    { id: 1, role: 'user', createdAt: 499 },
    { id: 2, role: 'assistant', createdAt: 501 },
    { id: 5, role: 'user', createdAt: 690 },
    { id: 6, role: 'assistant', createdAt: 701 }
  ];
  // The kid's amendment came after the OLD proposal, but not after the new one.
  assert.equal(resolveProposalAnswered(chat, amended), false);
  assert.notEqual(
    resolveRoadmapView(amended)!.key,
    resolveRoadmapView(roadmapPlan())!.key
  );
});

test("a typed stop asks first: Stop build plan / Keep it under Lumine's question", () => {
  const plan = roadmapPlan({
    status: 'running',
    done: 3,
    currentSteps: ['completed', 'pending', 'pending']
  }) as any;
  plan.plan.pendingStopConfirmAt = 1200;
  plan.plan.pendingStopConfirmMessageId = 12;
  const view = resolveRoadmapView(plan, { generating: false })!;
  assert.deepEqual(view.stopConfirm, { at: 1200, messageId: 12 });
  const chat = [
    { id: 11, role: 'user', createdAt: 1199 },
    { id: 12, role: 'assistant', createdAt: 1201 }
  ];
  const answered = resolveStopConfirmAnswered(chat, view);
  assert.equal(answered, false);
  // The plan still runs, so the panel stays; the buttons sit under the reply.
  assert.deepEqual(
    resolveRoadmapSurfaces(view, {
      generating: false,
      stopConfirmAnswered: answered
    }),
    { panel: true, strip: false, transcriptCard: 'stop_confirm' }
  );
  // "Stop build plan" sends the existing cancel action.
  assert.deepEqual(resolveRoadmapActionRequest('cancel', view), {
    message: 'Stop the build plan',
    planAction: 'cancel'
  });
  // "Keep it" just dismisses (no request).
  assert.deepEqual(
    resolveRoadmapSurfaces(view, {
      generating: false,
      memory: { stopConfirmDismissedAt: 1200 }
    }),
    { panel: true, strip: false, transcriptCard: null }
  );
  // Typing anything else after the question also dismisses it.
  const typed = [...chat, { id: 13, role: 'user', createdAt: 1300 }];
  assert.equal(resolveStopConfirmAnswered(typed, view), true);
  // Mid-run it never shows.
  assert.equal(
    resolveRoadmapSurfaces(resolveRoadmapView(plan, { generating: true }), {
      generating: true
    }).transcriptCard,
    null
  );
});

test('a plan cancelled on a pivot disappears at once', () => {
  for (const before of [
    roadmapPlan({ status: 'running', done: 2 }),
    roadmapPlan({ status: 'running', done: 3 }),
    roadmapPlan()
  ]) {
    const visible = resolveRoadmapSurfaces(resolveRoadmapView(before), {
      generating: false
    });
    assert.ok(visible.panel || visible.strip || visible.transcriptCard);
    // The emitted executionPlan comes back cancelled.
    const after = { ...before, status: 'cancelled' as const };
    assert.equal(resolveRoadmapView(after), null);
    assert.deepEqual(
      resolveRoadmapSurfaces(resolveRoadmapView(after), { generating: false }),
      { panel: false, strip: false, transcriptCard: null }
    );
  }
});
