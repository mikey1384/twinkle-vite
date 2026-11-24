import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readSponsoredHelpView,
  sponsoredHelpStatusLine,
  type SponsoredHelpView
} from '../src/helpers/sponsoredHelp';

const VIEW: SponsoredHelpView = {
  id: 9,
  persona: 'zero',
  task: 'Start a Lumine project called krillion',
  energyPercent: 10,
  status: 'sent',
  senderId: 1,
  senderUsername: 'mikey',
  recipientId: 2,
  recipientUsername: 'ryrytwinkie',
  createdAt: 0,
  expiresAt: 0
};

test('only the server-issued rows render as a sponsored help card', () => {
  assert.deepEqual(
    readSponsoredHelpView({ rootType: 'sponsoredHelp', rootId: 9, settings: { sponsoredHelp: VIEW } }),
    { view: VIEW, variant: 'dm' }
  );
  assert.equal(
    readSponsoredHelpView({ rootType: 'sponsoredHelpCard', rootId: 9, settings: { sponsoredHelp: VIEW } })?.variant,
    'assistant'
  );
  // a member's own message carrying the same settings is plain text
  assert.equal(readSponsoredHelpView({ rootType: null, settings: { sponsoredHelp: VIEW } }), null);
  // a view for another request does not attach to this row
  assert.equal(
    readSponsoredHelpView({ rootType: 'sponsoredHelp', rootId: 10, settings: { sponsoredHelp: VIEW } }),
    null
  );
});

test('the sender sees their Energy came back when it was not used', () => {
  const sender = { isSender: true, isRecipient: false, variant: 'dm' as const };
  assert.match(sponsoredHelpStatusLine({ ...VIEW, status: 'declined' }, sender), /Energy back/);
  assert.match(sponsoredHelpStatusLine({ ...VIEW, status: 'expired' }, sender), /Energy back/);
  assert.equal(sponsoredHelpStatusLine({ ...VIEW, status: 'sent' }, sender), 'Waiting for ryrytwinkie');
});
