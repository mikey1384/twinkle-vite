const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const { transformSync } = require('esbuild');
function compile(file, deps, globals = {}) {
  const module = { exports: {} };
  const code = transformSync(fs.readFileSync(file, 'utf8'), {
    loader: 'ts',
    format: 'cjs'
  }).code;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(
    (name) => {
      assert.ok(name in deps, name);
      return deps[name];
    },
    module,
    module.exports,
    ...Object.values(globals)
  );
  return module.exports;
}
async function fixture() {
  const requests = [],
    listeners = new Map(),
    histories = [];
  const socket = {
    id: 'original-tab',
    connected: true,
    on: (name, fn) => listeners.set(name, fn),
    timeout() {
      return this;
    },
    emit(name, input, ack) {
      requests.push({ name, input, ack });
      if (name === 'ai_start_ai_voice_conversation')
        ack(null, { started: true, assistantName: 'Ciel' });
    }
  };
  const controller = compile('src/helpers/voiceSessionController.ts', {});
  const helper = compile(
    'src/helpers/aiVoiceCall.ts',
    {
      '~/constants/sockets/api': { socket },
      '~/constants/siteBrand': { SITE_NAME: 'Twinkle' },
      '~/helpers/analytics': { trackEvent() {} },
      './voiceSessionController': controller,
      '~/containers/App/AssistantDock/conversationStore': {
        getAssistantReply: () => null,
        getAssistantTranscript: () => [],
        seedAssistantTranscript: (...args) => histories.push(args)
      }
    },
    {
      crypto: require('node:crypto').webcrypto,
      window: { dispatchEvent() {} },
      navigator: {
        mediaDevices: {
          getUserMedia: async () => ({
            getTracks: () => [],
            getAudioTracks: () => []
          })
        }
      }
    }
  );
  await helper.startAiVoiceCall(10, 7, { assistant: 'Ciel' });
  return {
    helper,
    socket,
    histories,
    requests,
    receive: (name, data) => listeners.get(name)?.(data),
    send: () => helper.submitAiVoiceText('Explain the equation', 10, 7)
  };
}
test('uncertain send retry keeps the same nonce, and only a confirmed receipt settles it', async () => {
  const f = await fixture();
  const first = f.send();
  const failed = assert.rejects(first, /draft is kept/);
  const original = f.requests.at(-1);
  original.ack(new Error('timeout'));
  await failed;
  const retry = f.send();
  assert.equal(
    f.requests.at(-1).input.clientMessageId,
    original.input.clientMessageId
  );
  f.requests.at(-1).ack(null, { sent: true });
  assert.equal(await retry, true);
});

test('reconnection confirms the exact old call and restores saved history before enabling text', async () => {
  const f = await fixture();
  assert.equal(f.helper.needsVoiceReconciliation(), false);
  const callId = f.helper.aiVoiceSession.getSnapshot().callId;
  f.socket.connected = false;
  f.helper.aiVoiceSession.disconnected();
  await assert.rejects(f.helper.endAiVoiceCall(false), /Reconnecting/);
  assert.equal(f.helper.aiVoiceSession.getSnapshot().phase, 'ending');
  f.socket.connected = true;
  f.socket.id = 'reconnected-tab';
  assert.equal(f.helper.needsVoiceReconciliation(), true);
  const ending = f.helper.endAiVoiceCall(false);
  const request = f.requests.at(-1);
  assert.equal(request.name, 'ai_reconcile_voice_conversation');
  assert.equal(request.input.callId, callId);
  assert.equal(request.input.topicId, 7);
  assert.equal(f.helper.aiVoiceSession.getSnapshot().phase, 'ending');
  request.ack(null, {
    ended: true,
    history: [{ id: 3, content: 'Final transcript' }]
  });
  await ending;
  assert.equal(f.histories[0][0][0].content, 'Final transcript');
  assert.equal(f.histories[0][1], 10);
  assert.equal(f.helper.aiVoiceSession.getSnapshot().phase, 'text');
});

test('ordinary auth refresh does not qualify an in-progress handoff for forced reconciliation', async () => {
  const f = await fixture();
  const ending = f.helper.endAiVoiceCall();
  assert.equal(f.helper.aiVoiceSession.getSnapshot().phase, 'ending');
  assert.equal(f.helper.needsVoiceReconciliation(), false);
  assert.equal(f.requests.at(-1).name, 'ai_end_ai_voice_conversation');
  assert.equal(f.requests.at(-1).input.handoff, true);
  f.requests.at(-1).ack(null, { ended: true });
  await ending;
});
test('canonical chat receipt settles an otherwise lost ack without resending', async () => {
  const f = await fixture();
  const sending = f.send(),
    request = f.requests.at(-1);
  f.receive('new_message_received', {
    message: {
      settings: JSON.stringify({
        voiceMessageId: request.input.clientMessageId
      })
    }
  });
  request.ack(new Error('ack lost'));
  assert.equal(await sending, true);
  assert.equal(
    f.requests.filter((r) => r.name === 'ai_call_message_submit').length,
    1
  );
});
test('unconfirmed voice message cannot be accidentally sent again in another call or text mode', async () => {
  const f = await fixture();
  const sending = f.send(),
    rejected = assert.rejects(sending);
  f.requests.at(-1).ack(new Error('timeout'));
  await rejected;
  f.helper.aiVoiceSession.ended(f.helper.aiVoiceSession.getSnapshot().callId);
  const count = f.requests.length;
  await assert.rejects(f.send(), /Check the full chat/);
  assert.equal(f.requests.length, count);
});
test('retry outside the server nonce window refuses to duplicate an older uncertain message', async () => {
  const f = await fixture();
  const first = f.send(),
    rejected = assert.rejects(first);
  f.requests.at(-1).ack(new Error('timeout'));
  await rejected;
  for (let n = 0; n < 100; n++) {
    const next = f.helper.submitAiVoiceText('Next turn ' + n, 10, 7);
    f.requests.at(-1).ack(null, { sent: true });
    await next;
  }
  const count = f.requests.length;
  await assert.rejects(f.send(), /older message/);
  assert.equal(f.requests.length, count);
});
