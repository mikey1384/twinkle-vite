const { assert, test, compile } = require('./helpers/chatDialogHarness.cjs');

function createScrollControls() {
  const frames = new Map();
  let nextFrame = 0;
  const container = {
    scrollTop: 1500,
    scrollHeight: 2000,
    clientHeight: 500,
    scrollTo({ top }) {
      this.scrollTop = Math.min(top, this.scrollHeight - this.clientHeight);
    }
  };
  const shouldAutoScrollRef = { current: true };
  const helpers = compile(
    'src/containers/Build/Editor/helpers/chatStickToBottom.ts',
    {}
  );
  const useChatScrollControls = compile(
    'src/containers/Build/Editor/hooks/useChatScrollControls.ts',
    {
      react: { useRef: (current) => ({ current }) },
      '../helpers/chatStickToBottom': helpers
    },
    {
      requestAnimationFrame: (callback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      },
      cancelAnimationFrame: (id) => frames.delete(id)
    }
  ).default;
  const controls = useChatScrollControls({
    chatEndRef: { current: null },
    chatScrollRef: { current: container },
    pendingScrollBehaviorRef: { current: 'auto' },
    scrollRafRef: { current: null },
    shouldAutoScrollRef
  });
  controls.handleChatScroll();
  return {
    controls,
    container,
    shouldAutoScrollRef,
    flush() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback());
    }
  };
}

test('scrolling up cancels an already queued streaming scroll', () => {
  const { controls, container, shouldAutoScrollRef, flush } = createScrollControls();
  controls.maybeAutoScrollDuringStream();
  container.scrollTop = 1470;
  controls.handleChatScroll();
  flush();
  assert.equal(container.scrollTop, 1470);
  assert.equal(shouldAutoScrollRef.current, false);

  container.scrollHeight += 100;
  controls.maybeAutoScrollDuringStream();
  flush();
  assert.equal(container.scrollTop, 1470);
});

test('scrolling down again and explicitly jumping to the bottom still work', () => {
  const { controls, container, shouldAutoScrollRef, flush } = createScrollControls();
  container.scrollTop = 1300;
  controls.handleChatScroll();
  container.scrollTop = 1450;
  controls.handleChatScroll();
  controls.maybeAutoScrollDuringStream();
  flush();
  assert.equal(container.scrollTop, 1500);
  assert.equal(shouldAutoScrollRef.current, true);

  container.scrollTop = 800;
  controls.handleChatScroll();
  controls.scrollChatToBottom('auto', { force: true });
  flush();
  assert.equal(container.scrollTop, 1500);
});
