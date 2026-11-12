const { assert, test, React, compile, css, nodes, source, callback } = require('./helpers/chatDialogHarness.cjs');

const game = compile('src/containers/Chat/helpers/gameMessageIds.ts', {});

function messageContent() {
  const file = 'src/containers/Chat/Message/MessageBody/Content.tsx';
  const imports = [...source(file).matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)]
    .map((match) => match[1]);
  const stub = () => null;
  const deps = Object.fromEntries(imports.map((name) => [name, stub]));
  const Chess = () => null;
  const Position = () => null;
  const Text = () => null;
  Object.assign(deps, {
    react: React,
    '@emotion/css': { css },
    '~/constants/css': { Color: { red: () => '#f00' } },
    '../../Chess': Chess,
    '../../Styles': { MessageStyle: 'message' },
    './TargetChessPosition': Position,
    './TargetMessage': { default: stub, RemovedTargetMessage: stub },
    './TextMessage': Text,
    './messageSettings': { parseMessageSettings: () => ({}) },
    './WebsiteAgentCard': { default: stub, isWebsiteAgentCardData: () => false },
    '~/constants/defaultValues': { isWebsiteAgentEnabledFor: () => false },
    '~/containers/Chat/Chess/helpers/theme': { getUserChatSquareColors: () => ({}) }
  });
  return { Content: compile(file, deps).default, Chess, Position, Text };
}

function renderContent(Content, chessState, overrides = {}) {
  const isChessDiscussion = game.isChessDiscussionPosition(chessState);
  return Content({
    channelId: 4,
    currentChannel: { gameState: { chess: {} } },
    displayedThemeColor: 'logoBlue',
    hasChessBoardState: !!chessState && !isChessDiscussion,
    hasOmokBoardState: false,
    isChessDiscussion,
    message: { id: 19, userId: 5, content: "Let's talk about this position", chessState },
    myId: 5,
    partner: {},
    userId: 5,
    ...overrides
  });
}

test('a chess discussion shows both the position and the author’s words', () => {
  const { Content, Chess, Position, Text } = messageContent();
  const position = { isDiscussion: true, board: Array.from({ length: 64 }, () => ({})) };
  const tree = renderContent(Content, position);
  const positions = nodes(tree, (node) => node.type === Position);
  const texts = nodes(tree, (node) => node.type === Text);
  assert.equal(positions.length, 1);
  assert.equal(positions[0].props.chessState, position);
  assert.equal(texts.length, 1);
  assert.equal(texts[0].props.content, "Let's talk about this position");
  assert.equal(nodes(tree, (node) => node.type === Chess).length, 0);
});

test('a chess move keeps the existing Discuss action', () => {
  const { Content, Chess, Position } = messageContent();
  const position = { board: Array.from({ length: 64 }, () => ({})) };
  let selected;
  const tree = renderContent(Content, position, { onSetChessTarget: (value) => { selected = value; } });
  const boards = nodes(tree, (node) => node.type === Chess);
  assert.equal(boards.length, 1);
  assert.equal(nodes(tree, (node) => node.type === Position).length, 0);
  boards[0].props.onDiscussClick();
  assert.equal(selected.channelId, 4);
  assert.equal(selected.messageId, 19);
  assert.equal(selected.chessState.board, position.board);
});

test('a discussion or retry never replaces the latest chess move', () => {
  const move = { id: 10, chessState: { board: [] } };
  const discussion = { id: 11, chessState: { isDiscussion: true, board: [] } };
  const retry = { id: 12, chessState: { isRewindRequest: true, board: [] } };
  const channel = {
    latestChessBoardMessageId: 11,
    recentChessMessage: retry,
    messageIds: [12, 11, 10],
    messagesObj: { 10: move, 11: discussion, 12: retry }
  };
  assert.equal(game.getLatestGameMessage(channel, 'chess'), move);
  assert.equal(game.isChessDiscussionPosition(discussion.chessState), true);
  assert.equal(game.isChessDiscussionPosition(retry.chessState), true);
  assert.equal(game.isChessDiscussionPosition(move.chessState), false);
  assert.equal(game.getLatestGameMessage({ messageIds: [11], messagesObj: { 11: discussion } }, 'chess'), null);
});

test('sending a discussion keeps its text, position and chat scope', async () => {
  const position = { isDiscussion: true, board: [] };
  let submitted;
  let cleared;
  const send = callback(
    'src/containers/Chat/Body/MessagesContainer/index.tsx',
    'handleSubmitChessTargetMessage',
    {
      uuidv1: () => 'local-id',
      chessTarget: position,
      selectedChannelId: 4,
      appliedTopicId: 30,
      profilePicUrl: '',
      userId: 5,
      username: 'mikey',
      onSubmitMessage: (value) => { submitted = value; },
      onScrollToBottom: () => {},
      onSetChessTarget: (value) => { cleared = value; }
    }
  );
  await send({ content: 'Let’s discuss this', selectedTab: 'topic', subchannelId: 7, topicId: 30 });
  assert.equal(submitted.message.content, 'Let’s discuss this');
  assert.equal(submitted.message.chessState, position);
  assert.equal(submitted.message.subjectId, 30);
  assert.equal(submitted.subchannelId, 7);
  assert.equal(submitted.topicId, 30);
  assert.equal(cleared.target, null);
  assert.equal(cleared.subchannelId, 7);
});

function chatReducer() {
  const file = 'src/contexts/Chat/reducer.ts';
  const imports = [...source(file).matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)]
    .map((match) => match[1]);
  const deps = Object.fromEntries(imports.map((name) => [name, {}]));
  deps['.'] = { initialChatState: {} };
  deps.uuid = { v1: () => 'test-id' };
  return compile(file, deps).default;
}

test('selecting Discuss, Reply or a topic keeps the active composer target unambiguous', () => {
  const reduce = chatReducer();
  const channelId = 4;
  let state = { channelsObj: { [channelId]: { replyTarget: { id: 1 }, isRespondingToSubject: true } } };
  state = reduce(state, { type: 'SET_CHESS_TARGET', channelId, messageId: 10, target: { board: [] } });
  let channel = state.channelsObj[channelId];
  assert.equal(channel.replyTarget, null);
  assert.equal(channel.isRespondingToSubject, false);
  assert.equal(channel.chessTarget.isDiscussion, true);

  state = reduce(state, { type: 'SET_REPLY_TARGET', channelId, target: { id: 2 } });
  channel = state.channelsObj[channelId];
  assert.equal(channel.chessTarget, null);
  assert.equal(channel.replyTarget.id, 2);

  state = reduce(state, { type: 'SET_CHESS_TARGET', channelId, messageId: 10, target: { board: [] } });
  state = reduce(state, { type: 'SET_IS_RESPONDING_TO_SUBJECT', channelId, isResponding: true });
  assert.equal(state.channelsObj[channelId].chessTarget, null);
  assert.equal(state.channelsObj[channelId].isRespondingToSubject, true);

  state = { channelsObj: { [channelId]: {
    replyTarget: { id: 3 },
    subchannelObj: { 7: { replyTarget: { id: 4 }, isRespondingToSubject: true }, 8: { replyTarget: { id: 5 } } }
  } } };
  state = reduce(state, { type: 'SET_CHESS_TARGET', channelId, subchannelId: 7, messageId: 10, target: { board: [] } });
  channel = state.channelsObj[channelId];
  assert.equal(channel.subchannelObj[7].replyTarget, null);
  assert.equal(channel.subchannelObj[7].isRespondingToSubject, false);
  assert.equal(channel.subchannelObj[7].chessTarget.isDiscussion, true);
  assert.equal(channel.chessTarget, undefined);
  assert.equal(channel.subchannelObj[8].replyTarget.id, 5);
  assert.equal(channel.replyTarget.id, 3);
  state = reduce(state, { type: 'SET_REPLY_TARGET', channelId, subchannelId: 7, target: { id: 6 } });
  channel = state.channelsObj[channelId];
  assert.equal(channel.subchannelObj[7].chessTarget, null);
  assert.equal(channel.subchannelObj[7].replyTarget.id, 6);
  assert.equal(channel.subchannelObj[8].replyTarget.id, 5);
});

test('chess discussion targets stay in their own chat scope', () => {
  const reduce = chatReducer();
  const channelId = 4;
  let state = { channelsObj: { [channelId]: { subchannelObj: { 7: {}, 8: {} } } } };
  state = reduce(state, { type: 'SET_CHESS_TARGET', channelId, messageId: 10, target: { board: ['main'] } });
  state = reduce(state, { type: 'SET_CHESS_TARGET', channelId, subchannelId: 7, messageId: 11, target: { board: ['seven'] } });
  state = reduce(state, { type: 'SET_CHESS_TARGET', channelId, subchannelId: 8, messageId: 12, target: { board: ['eight'] } });
  state = reduce(state, { type: 'SET_CHESS_TARGET', channelId, subchannelId: 7, target: null });
  const channel = state.channelsObj[channelId];
  assert.deepEqual(channel.chessTarget.board, ['main']);
  assert.equal(channel.subchannelObj[7].chessTarget, null);
  assert.deepEqual(channel.subchannelObj[8].chessTarget.board, ['eight']);
});
