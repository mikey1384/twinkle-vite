const {
  assert,
  test,
  compile,
  driver,
  nodes
} = require('./helpers/chatDialogHarness.cjs');
function fixture() {
  const d = driver(),
    Modal = () => null,
    Game = () => null,
    Footer = () => null,
    leaf = () => null,
    calls = [];
  const ctx = {
    myState: { userId: 1, username: 'Preview', banned: {} },
    theme: { warning: { color: 'orange' }, done: { color: 'green' } },
    state: { chessThemeVersion: 1, stats: { maxLevelUnlocked: 1 } },
    actions: {
      onUpdateLastChessMoveViewerId: () => {},
      onSubmitMessage: (v) => calls.push(v)
    },
    requestHelpers: { setChessMoveViewTimeStamp: async () => {} }
  };
  const Component = compile(
    'src/containers/Chat/Modals/GameModals/ChessModal/index.tsx',
    {
      react: { ...d.hooks, useCallback: (fn) => fn },
      '~/components/Modals/ConfirmModal': leaf,
      '~/components/FilterBar': leaf,
      '~/components/ErrorBoundary': leaf,
      '~/components/Modal': Modal,
      '../ModalContentWrapper': leaf,
      '../GameModalFooter': Footer,
      './ChessGame': Game,
      '~/containers/Chat/Chess/GameRecord': leaf,
      './Rewind': leaf,
      '~/constants/sockets/api': {
        socket: {
          emit: () => {
            throw Error('Unexpected socket write');
          }
        }
      },
      '~/contexts': Object.fromEntries(
        [
          'useAppContext',
          'useChatContext',
          'useKeyContext',
          'useChessContext'
        ].map((k) => [k, (fn) => fn(ctx)])
      ),
      uuid: { v1: () => 'synthetic' },
      '~/helpers/userDataHelpers': { getStoredItem: () => null },
      '~/containers/Chat/Chess/helpers/theme': {
        getAllowedChatChessThemes: () => [],
        mapThemeToColors: () => undefined
      }
    }
  ).default;
  const props = {
    channelId: 2,
    myId: 1,
    currentChannel: { id: 2 },
    socketConnected: true,
    onConfirmChessMove: (v) => calls.push(v),
    onHide: () => {},
    onScrollToBottom: () => {}
  };
  const render = () => d.render(() => Component(props));
  return {
    d,
    props,
    ctx,
    calls,
    render,
    game: (t) => nodes(t, (n) => n.type === Game)[0].props,
    modal: (t) => nodes(t, (n) => n.type === Modal)[0].props,
    footer: (t) => nodes(t, (n) => n.type === Modal)[0].props.footer.props
  };
}
test('parent blocks draft submission until board readiness and blocks immediately after scope changes', async () => {
  const f = fixture();
  let tree = f.render();
  f.game(tree).onSetNewChessState({ move: { number: 1 } });
  tree = f.render();
  assert.equal(f.footer(tree).doneDisabled, true);
  await f.footer(tree).onDone();
  assert.equal(f.calls.length, 0);
  f.game(tree).onLoadStateChange(true);
  tree = f.render();
  assert.equal(f.footer(tree).doneDisabled, false);
  await f.footer(tree).onDone();
  assert.equal(f.calls.length, 1);
  f.props.channelId = 3;
  tree = f.render();
  assert.equal(f.footer(tree).actionsDisabled, true);
  await f.footer(tree).onDone();
  assert.equal(f.calls.length, 1);
  f.game(tree).onLoadStateChange(true);
  tree = f.render();
  assert.equal(f.game(tree).newChessState, null);
  assert.equal(f.footer(tree).doneDisabled, true);
  await f.footer(tree).onDone();
  assert.equal(f.calls.length, 1);
  f.d.dispose();
});
test('rewind view disables normal game actions and disconnected or banned users cannot submit', async () => {
  const f = fixture();
  f.props.currentChannel.gameState = { chess: { rewindRequestId: 20 } };
  let tree = f.render();
  f.game(tree).onSetNewChessState({ move: { number: 1 } });
  f.game(tree).onLoadStateChange(true);
  tree = f.render();
  f.props.socketConnected = false;
  tree = f.render();
  await f.footer(tree).onDone();
  assert.equal(f.calls.length, 0);
  f.props.socketConnected = true;
  f.ctx.myState.banned.chess = true;
  tree = f.render();
  await f.footer(tree).onDone();
  assert.equal(f.calls.length, 0);
  f.ctx.myState.banned.chess = false;
  tree = f.render();
  nodes(
    f.modal(tree).header,
    (n) => n.type === 'nav' && n.props.children === 'Rewind Request'
  )[0].props.onClick();
  tree = f.render();
  assert.equal(f.footer(tree).actionsDisabled, true);
  await f.footer(tree).onDone();
  await f.footer(tree).onOfferDraw();
  assert.equal(f.calls.length, 0);
  f.d.dispose();
});
