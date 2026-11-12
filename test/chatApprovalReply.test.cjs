const { assert, test, React, compile } = require('./helpers/chatDialogHarness.cjs');

test('an approval notification updates only the requester’s card and its replies', () => {
  const listeners = [];
  const updates = [];
  let stateIndex = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const value = stateIndex++ % 4 === 0 ? 'dob' : initial;
      return [value, () => {}];
    },
    useEffect(effect) { effect(); }
  };
  const socket = { on: (_name, listener) => listeners.push(listener), off: () => {} };
  const ApprovalRequest = compile('src/containers/Chat/Message/MessageBody/ApprovalRequest/index.tsx', {
    react: hooks,
    './Container': () => null,
    '~/components/Loading': () => null,
    '~/contexts': {
      useKeyContext: (selector) => selector({ myState: { userId: 5 } }),
      useAppContext: (selector) => selector({ requestHelpers: {
        loadApprovalItemById: () => new Promise(() => {})
      } }),
      useChatContext: (selector) => selector({ actions: {
        onUpdateMessageSettings: (value) => updates.push(value)
      } })
    },
    '~/constants/css': { borderRadius: '1rem', Color: { darkGray: () => '#333' } },
    '~/constants/sockets/api': { socket },
    '../ReplyCardPresentation': { useReplyCardPresentation: () => false }
  }).default;
  for (const [userId, messageId] of [[5, 20], [9, 21]]) {
    ApprovalRequest({ channelId: 4, displayedThemeColor: 'logoBlue', messageId,
      requestId: messageId + 100, userId, username: 'member' });
  }
  for (const listener of listeners) listener({ type: 'dob', status: 'approved' });
  assert.deepEqual(updates, [{ channelId: 4, messageId: 20,
    settings: { approvalCardStatus: 'approved' } }]);
});
