import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  againConfirmText,
  againRefusalText,
  cardActions,
  confirmAllPlanHashes,
  energyPercentLabel,
  followUpNotice,
  objectiveActions,
  objectiveStateLabel,
  readCommentWandCardId,
  readSponsoredHelpCardView,
  wandTalkContext,
  wandViewerFor,
  type SponsoredHelpCardView,
  type SponsoredHelpObjectiveView
} from '../src/helpers/sponsoredHelp';
import { canUseGenericChatMessageActions } from '../src/helpers/chatMessageCapabilities';

// Wand cards with 1 to 3 objectives (twinkle-api helpers/sponsoredHelp/
// cards.ts): which states read how, and which buttons each person gets.

const objective = (patch: Partial<SponsoredHelpObjectiveView>): SponsoredHelpObjectiveView => ({
  index: 0,
  text: 'Quiz me on fractions',
  requestId: 11,
  status: 'sent',
  state: 'pending',
  energyPercent: 3.3,
  attempts: 1,
  isAgain: false,
  ...patch
});

const CARD: SponsoredHelpCardView = {
  cardId: 9,
  surface: 'dm',
  persona: 'zero',
  senderId: 1,
  senderUsername: 'mikey',
  recipientId: 2,
  recipientUsername: 'kid',
  createdAt: 0,
  expiresAt: 0,
  energyPercent: 10,
  objectives: [
    objective({ index: 0, requestId: 11 }),
    objective({ index: 1, requestId: 12, text: 'Make a game' }),
    objective({ index: 2, requestId: 13, text: 'Open the Arena' })
  ],
  viewer: 'sender'
};

test('only server-issued wand rows render as a card, and only for their own card id', () => {
  assert.equal(
    readSponsoredHelpCardView({ rootType: 'sponsoredHelpGroup', rootId: 9, settings: { sponsoredHelpCard: CARD } })?.variant,
    'dm'
  );
  assert.equal(
    readSponsoredHelpCardView({ rootType: 'sponsoredHelpGroupCard', rootId: 9, settings: { sponsoredHelpCard: CARD } })?.variant,
    'assistant'
  );
  assert.equal(readSponsoredHelpCardView({ rootType: null, settings: { sponsoredHelpCard: CARD } }), null);
  assert.equal(readSponsoredHelpCardView({ rootType: 'sponsoredHelpGroup', rootId: 10, settings: { sponsoredHelpCard: CARD } }), null);
  // server-issued cards: no edit/delete like a member's own message
  assert.equal(canUseGenericChatMessageActions({ rootType: 'sponsoredHelpGroup' } as any), false);
  assert.equal(canUseGenericChatMessageActions({ rootType: 'sponsoredHelpGroupCard' } as any), false);
});

test('a comment names its card only through settings; bad values are no card', () => {
  assert.equal(readCommentWandCardId({ settings: { sponsoredHelpCard: { cardId: 4 } } }), 4);
  assert.equal(readCommentWandCardId({ settings: JSON.stringify({ sponsoredHelpCard: { cardId: 5 } }) }), 5);
  assert.equal(readCommentWandCardId({ settings: '{bad' }), 0);
  assert.equal(readCommentWandCardId({ settings: { sponsoredHelpCard: { cardId: -1 } } }), 0);
  assert.equal(readCommentWandCardId(null), 0);
});

test('the viewer comes from the member’s own id (one DM view serves both people)', () => {
  assert.equal(wandViewerFor(CARD, 2), 'recipient');
  assert.equal(wandViewerFor(CARD, 1), 'sender');
  assert.equal(wandViewerFor(CARD, 3), 'bystander');
  assert.equal(wandViewerFor(CARD, 0), 'bystander');
});

test('each objective’s state reads for whoever is looking', () => {
  const recipient = { persona: 'zero', viewer: 'recipient' as const, recipientUsername: 'kid' };
  const sender = { ...recipient, viewer: 'sender' as const };
  assert.equal(objectiveStateLabel(objective({ state: 'pending' }), recipient), 'Ready');
  assert.equal(objectiveStateLabel(objective({ state: 'pending' }), sender), 'Waiting for kid');
  assert.equal(objectiveStateLabel(objective({ state: 'asking', status: 'asking' }), recipient), 'Zero has a question');
  assert.equal(objectiveStateLabel(objective({ state: 'asking', status: 'asking' }), sender), 'kid is choosing');
  assert.equal(objectiveStateLabel(objective({ state: 'working', status: 'running' }), recipient), 'Zero is on it');
  assert.equal(objectiveStateLabel(objective({ state: 'done', status: 'completed' }), recipient), 'Done');
  assert.equal(objectiveStateLabel(objective({ state: 'done', status: 'completed', isAgain: true }), recipient), 'Done again');
  assert.equal(objectiveStateLabel(objective({ state: 'declined', status: 'declined' }), sender), 'No thanks');
  assert.equal(objectiveStateLabel(objective({ state: 'failed', status: 'failed' }), recipient), 'Didn’t work');
});

test('only the person it is for gets buttons; the sender and bystanders only read', () => {
  const pending = objective({});
  assert.deepEqual(objectiveActions(pending, { viewer: 'recipient', place: 'dm' }), ['press']);
  assert.deepEqual(objectiveActions(pending, { viewer: 'recipient', place: 'comment' }), ['press']);
  assert.deepEqual(objectiveActions(pending, { viewer: 'sender', place: 'dm' }), []);
  assert.deepEqual(objectiveActions(pending, { viewer: 'bystander', place: 'comment' }), []);
});

test('the Zero/Ciel chat card holds the question, the plan, the run and Do it again', () => {
  const at = { viewer: 'recipient' as const, place: 'assistant' as const };
  assert.deepEqual(objectiveActions(objective({ status: 'asking', state: 'asking' }), at), ['answer', 'decline']);
  assert.deepEqual(
    objectiveActions(
      objective({ status: 'awaiting_confirm', state: 'deciding', steps: [{ action: 'open_page', path: '/arena' }], changesLeft: 2 }),
      at
    ),
    ['confirm', 'change', 'decline']
  );
  // a plan with nothing to do can only be changed or declined
  assert.deepEqual(objectiveActions(objective({ status: 'awaiting_confirm', state: 'deciding', steps: [], changesLeft: 0 }), at), ['decline']);
  assert.deepEqual(objectiveActions(objective({ status: 'running', state: 'working' }), at), ['talk']);
  assert.deepEqual(
    objectiveActions(objective({ status: 'completed', state: 'done', againAvailable: true, result: { buildId: 4, buildTitle: 'Racer' } }), at),
    ['open_result', 'again']
  );
  assert.deepEqual(objectiveActions(objective({ status: 'declined', state: 'declined', againAvailable: true }), at), ['again']);
  // a finished session goes on while the sender's share pays (or just ran out)
  assert.deepEqual(
    objectiveActions(objective({ status: 'completed', state: 'done', followUp: 'sponsored', againAvailable: true }), at),
    ['talk', 'again']
  );
  assert.deepEqual(objectiveActions(objective({ status: 'completed', state: 'done', followUp: 'none' }), at), []);
  // elsewhere the in-between steps send them to their chat
  assert.deepEqual(objectiveActions(objective({ status: 'asking', state: 'asking' }), { viewer: 'recipient', place: 'dm' }), ['open_chat']);
  // the DM message has no Do it again (that lives where the plan does)
  assert.deepEqual(objectiveActions(objective({ status: 'completed', state: 'done', againAvailable: true }), { viewer: 'recipient', place: 'dm' }), []);
});

test('card buttons: Do all while any waits, Confirm all when ready, Take back for the sender', () => {
  const recipient = { ...CARD, viewer: 'recipient' as const };
  assert.deepEqual(cardActions(recipient, { place: 'dm' }), { doAll: true, confirmAll: false, noThanks: true, takeBack: false });
  assert.equal(cardActions({ ...CARD, objectives: [CARD.objectives[0]], viewer: 'recipient' }, { place: 'dm' }).doAll, false);
  assert.equal(cardActions({ ...recipient, canConfirmAll: true }, { place: 'assistant' }).confirmAll, true);
  assert.equal(cardActions({ ...recipient, canConfirmAll: true }, { place: 'dm' }).confirmAll, false);
  assert.equal(cardActions(CARD, { place: 'dm' }).takeBack, true);
  assert.equal(cardActions({ ...CARD, viewer: 'bystander' }, { place: 'comment' }).doAll, false);
  const allStarted = { ...recipient, objectives: CARD.objectives.map((o) => ({ ...o, status: 'planning' as const, state: 'working' as const })) };
  assert.equal(cardActions(allStarted, { place: 'dm' }).doAll, false);
});

test('Confirm all quotes the hash of every ready plan, and only those', () => {
  const card = {
    ...CARD,
    objectives: [
      objective({ requestId: 11, status: 'awaiting_confirm', planHash: 'a', steps: [{ action: 'open_page', path: '/' }] }),
      objective({ requestId: 12, status: 'awaiting_confirm', planHash: 'b', steps: [] }),
      objective({ requestId: 13, status: 'completed', planHash: 'c', steps: [{ action: 'open_page', path: '/' }] })
    ]
  };
  assert.deepEqual(confirmAllPlanHashes(card), { '11': 'a' });
});

test('Do it again shows the cost in plain words, and a plain refusal when the battery is low', () => {
  assert.equal(energyPercentLabel(0.4), 'less than 1%');
  assert.equal(energyPercentLabel(2.6), 'about 3%');
  assert.equal(againConfirmText({ estimatePercent: 2.6 }), 'This uses about 3% of your battery.');
  assert.equal(
    againRefusalText({ estimatePercent: 2.6, remainingPercent: 0.7 }),
    'Your battery is too low for this right now. It needs about 3% and you have 0% left today.'
  );
});

test('the text/voice switch tells Zero/Ciel which card and objective', () => {
  assert.deepEqual(wandTalkContext(CARD, CARD.objectives[1]), {
    kind: 'sponsoredHelp',
    id: 9,
    no: 2,
    label: 'help card: Make a game'
  });
  assert.deepEqual(wandTalkContext(CARD), { kind: 'sponsoredHelp', id: 9, label: 'this help card' });
});

test('the member is told who pays their next turn, and when the sponsored part runs out', () => {
  assert.equal(followUpNotice({ followUp: 'sponsored' }, 'mikey'), 'mikey’s Energy covers this · text or call');
  assert.equal(followUpNotice({ followUp: 'low' }, 'mikey'), 'mikey’s Energy for this is nearly used');
  assert.equal(followUpNotice({ followUp: 'used_up' }, 'mikey'), 'mikey’s Energy for this is used up · now uses yours');
  assert.equal(followUpNotice({ followUp: 'none' }, 'mikey'), '');
  assert.equal(followUpNotice({}, 'mikey'), '');
});
