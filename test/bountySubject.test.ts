import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canPlayBountySubject,
  getBountySubjectAppPath,
  getBountySubjectCopy,
  getBountySubjectPlayerSrc,
  getBountySubjectSentence,
  normalizeBountySubject
} from '../src/helpers/bountySubject';

const listened = normalizeBountySubject({
  kind: 'song',
  action: 'listen',
  title: 'Night Drive',
  path: 'song-40-night-drive',
  imageUrl: null,
  creator: { id: 8, username: 'maker' }
})!;

test('a listening story reads as one plain sentence naming the song and its maker', () => {
  assert.deepEqual(getBountySubjectCopy(listened), { lead: 'Listened to', byCreator: true });
  assert.equal(
    getBountySubjectSentence({ subject: listened, username: 'listener', xp: 1000, appTitle: 'Groove Lab' }),
    'listener earned 1,000 XP listening to Night Drive by maker in Groove Lab'
  );
  const own = { ...listened, action: 'listen-own' as const };
  assert.deepEqual(getBountySubjectCopy(own), { lead: 'Listened to their own song', byCreator: false });
  assert.equal(
    getBountySubjectSentence({ subject: own, username: 'maker', xp: 400, appTitle: 'Groove Lab' }),
    'maker earned 400 XP listening to their own song Night Drive in Groove Lab'
  );
  assert.equal(getBountySubjectCopy({ ...listened, action: 'publish' }).lead, 'Published');
  // an app-supplied subject has no verb of its own: the rule title leads
  assert.equal(getBountySubjectCopy({ ...listened, kind: 'item', action: null }).lead, '');
});

test('the player opens the app’s own share page embedded; nothing else is ever framed', () => {
  assert.equal(getBountySubjectPlayerSrc(2206, listened.path), '/app/2206/song-40-night-drive?embedded=1');
  assert.equal(getBountySubjectAppPath(2206, listened.path), '/app/2206/song-40-night-drive');
  assert.equal(getBountySubjectAppPath(2206, null), '/app/2206');
  assert.equal(getBountySubjectPlayerSrc(2206, null), '');
  assert.equal(getBountySubjectPlayerSrc(0, 'song-1'), '');
  assert.equal(getBountySubjectPlayerSrc(2206, '//evil.example'), '');
  assert.equal(getBountySubjectPlayerSrc(2206, '../settings'), '');
  // unexpected shapes are dropped rather than rendered
  assert.equal(normalizeBountySubject({ title: '  ' }), null);
  assert.equal(normalizeBountySubject('Night Drive'), null);
  const odd = normalizeBountySubject({ title: 'x', path: 'javascript:alert(1)', imageUrl: 'http://x', creator: { id: 0, username: 'a' }, action: 'pwn' })!;
  assert.deepEqual(odd, { kind: 'item', action: null, title: 'x', path: null, imageUrl: null, creator: null });
});

test('Play appears only for a song the server identified, never an app-supplied subject', () => {
  assert.equal(canPlayBountySubject(listened), true);
  assert.equal(canPlayBountySubject({ ...listened, action: null }), false);
  assert.equal(canPlayBountySubject({ ...listened, kind: 'item' }), false);
  assert.equal(canPlayBountySubject(null), false);
});
