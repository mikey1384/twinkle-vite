const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');

function fixture() {
  const routes = [], selected = [];
  const Link = ({ to, children, ...props }) => React.createElement('a', { ...props, href: to }, children);
  const dependencies = {
    react: { ...React, useMemo: fn => fn(), useCallback: fn => fn, useRef: value => ({ current: value }), useContext: () => ({ state: { lastSubchannelPaths: { 7: 'topic' } } }) },
    '~/constants/css': { mobileMaxWidth: '767px', Color: { logoBlue: () => '#418ceb', lighterGray: () => '#aaa' } },
    '@emotion/css': { css: () => '', cx: (...classes) => classes.filter(Boolean).join(' ') },
    '~/helpers/stringHelpers': { addCommasToNumber: value => Number(value).toLocaleString('en-US'), stringIsEmpty: value => !value?.trim() },
    '~/contexts': { useKeyContext: fn => fn({ myState: { userId: 1 } }), useAppContext: fn => fn({ requestHelpers: { reportError() {} } }), useChatContext: fn => fn({ actions: { onUpdateSelectedChannelId: id => selected.push(id) } }) },
    '~/constants/defaultValues': { VOCAB_CHAT_TYPE: 'vocabulary', AI_CARD_CHAT_TYPE: 'ai-cards' },
    '~/components/ChatReactionEmoji': ({ reaction }) => React.createElement('i', { 'data-reaction': reaction }),
    '~/constants/chatReactions': { getChatReaction: key => ['fire', 'thumb'].includes(key) ? { label: key === 'fire' ? 'Fire' : 'Thumbs up' } : undefined },
    'react-router-dom': { Link, useNavigate: () => url => routes.push(url) },
    '../../Context': {}, '~/components/ErrorBoundary': ({ children }) => children,
    '~/theme/hooks/useRoleColor': { useRoleColor: () => ({ getColor: () => '#418ceb' }) },
    '~/helpers/chatUnreadProjection': { canonicalUnreadBadgeIsShown: count => Number.isFinite(Number(count)) && Number(count) > 0 },
    '../../containers': { chatChannelRowClass: 'channel' }
  };
  const module = { exports: {} };
  const source = readFileSync(path.resolve(__dirname, '../src/containers/Chat/LeftMenu/Channels/Channel.tsx'), 'utf8');
  new Function('require', 'module', 'exports', transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code)(name => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; }, module, module.exports);
  const channel = { id: 7, pathId: 101, partnerUsername: 'Mina', twoPeople: true, numUnreads: 3, messageIds: [10], messagesObj: { 10: { id: 10, userId: 2, username: 'Mina', content: 'Latest message', timeStamp: 100 } } };
  return { routes, selected, render(overrides = {}, props = {}) { return module.exports.default({ customChannelNames: {}, channel: { ...channel, ...overrides }, ...props }); } };
}
const markup = tree => renderToStaticMarkup(tree);

test('latest DM reaction renders named artwork, older reaction defers to the message, and groups keep their message preview', () => {
  const app = fixture(), reaction = { lastReaction: { reaction: 'fire', userId: 2, timeStamp: 101 } };
  assert.match(markup(app.render({ settings: reaction })), /Mina reacted/); assert.match(markup(app.render({ settings: JSON.stringify(reaction) })), /aria-label="Fire"/);
  assert.match(markup(app.render({ settings: { lastReaction: { ...reaction.lastReaction, userId: 1 } } })), /You reacted/);
  assert.match(markup(app.render({ settings: { lastReaction: { ...reaction.lastReaction, timeStamp: 99 } } })), /Mina: Latest message/);
  assert.match(markup(app.render({ twoPeople: false, channelName: 'General', settings: reaction })), /Mina: Latest message/);
});

test('malformed settings and non-string reaction data do not crash the channel row', () => {
  const app = fixture();
  for (const settings of ['{broken', null, [], { lastReaction: { reaction: {}, timeStamp: 101 } }]) assert.match(markup(app.render({ settings })), /Latest message/);
  assert.match(markup(app.render({ settings: { lastReaction: { reaction: '__proto__', timeStamp: 101 } } })), /Someone reacted __proto__/);
});

test('subchannel-only and partially loaded channels show the newest available preview', () => {
  const app = fixture();
  const subchannelObj = { 3: { messageIds: [50], messagesObj: { 50: { id: 50, userId: 2, username: 'Mina', content: 'Subchannel message' } } }, 4: { messageIds: [70], messagesObj: {} } };
  assert.match(markup(app.render({ messageIds: [], messagesObj: {}, subchannelObj })), /Mina: Subchannel message/);
  assert.match(markup(app.render({ messageIds: [100], messagesObj: {}, subchannelObj })), /Mina: Subchannel message/);
  assert.match(markup(app.render({ subchannelObj })), /Mina: Subchannel message/);
});

test('unread has an accessible label, stays suppressed on the active row, and partner-only name is not styled as deleted', () => {
  const app = fixture(); const html = markup(app.render());
  assert.match(html, /aria-label="Unread messages"/); assert.doesNotMatch(html, /color:#aaa/);
  assert.match(html, /min-width:12px;height:12px;outline:1px solid #64748b/);
  const active = markup(app.render({}, { selectedChannelId: 7, currentPathId: 101 }));
  assert.match(active, /aria-current="page"/); assert.doesNotMatch(active, /Unread messages/);
});

test('native channel link preserves canonical navigation and allows modified/open-in-new-tab clicks', () => {
  const app = fixture(); const link = app.render().props.children;
  assert.equal(link.props.to, '/chat/101/topic'); assert.match(markup(app.render()), /href="\/chat\/101\/topic"/);
  const event = overrides => ({ button: 0, preventDefault() { this.prevented = true; }, ...overrides });
  for (const overrides of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) { const e = event(overrides); link.props.onClick(e); assert.equal(e.prevented, undefined); }
  assert.equal(app.routes.length, 0);
  const e = event({}); link.props.onClick(e); assert.equal(e.prevented, true); assert.deepEqual(app.selected, [7]); assert.deepEqual(app.routes, ['/chat/101/topic']);
  assert.equal(app.render({ pathId: undefined }).props.children.props.to, '/chat/new');
  const active = fixture(); active.render({}, { currentPathId: 101, selectedChannelId: 7 }).props.children.props.onClick(event({})); assert.equal(active.routes.length, 0);
});

test('message preview keeps attachment, spoiler, game, reward and notification wording', () => {
  const app = fixture();
  const cases = [
    [{ content: '/spoiler hidden' }, 'Secret Message'],
    [{ content: '', fileName: 'recording.mp3' }, 'recording.mp3'],
    [{ isDraw: true, content: 'omok' }, 'omok match ended in a draw'],
    [{ gameWinnerId: 1, content: '' }, 'You won the chess match!'],
    [{ rewardAmount: 1234, targetMessage: { username: 'Kai' } }, 'rewarded Kai 1,234 XP'],
    [{ content: '', rootType: 'buildContributionSubmission' }, 'sent changes'],
    [{ content: '', rootType: 'buildRewardReview' }, 'sent an app for XP &amp; Coin reward review'],
    [{ notificationType: 'owner_change', newOwner: { username: 'Kai' } }, 'transferred ownership to Kai']
  ];
  for (const [message, expected] of cases) assert.ok(markup(app.render({ messagesObj: { 10: { id: 10, userId: 2, username: 'Mina', ...message } } })).includes(expected), expected);
});
