import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceSessionController } from '../src/helpers/voiceSessionController';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function fixture() {
  const microphones: ReturnType<typeof deferred<MediaStream>>[] = [];
  const connections: {
    input: any;
    result: ReturnType<typeof deferred<any>>;
  }[] = [];
  const ends: {
    id: string;
    handoff: boolean;
    result: ReturnType<typeof deferred<void>>;
  }[] = [];
  let id = 0,
    stoppedPlayback = 0;
  const controller = createVoiceSessionController({
    id: () => `call-${++id}`,
    microphone() {
      const request = deferred<MediaStream>();
      microphones.push(request);
      return request.promise;
    },
    connect(input) {
      const result = deferred<any>();
      connections.push({ input, result });
      return result.promise;
    },
    disconnect(id, handoff) {
      const result = deferred<void>();
      ends.push({ id, handoff, result });
      return result.promise;
    },
    stopPlayback() {
      stoppedPlayback++;
    }
  });
  function stream() {
    const track = {
      stopped: 0,
      enabled: true,
      stop() {
        this.stopped++;
      }
    };
    return {
      track,
      media: {
        getTracks: () => [track],
        getAudioTracks: () => [track]
      } as unknown as MediaStream
    };
  }
  async function connect(channelId = 1, topicId = 3) {
    const promise = controller.start({ channelId, topicId, assistant: 'Ciel' });
    const mic = stream();
    microphones.at(-1)!.resolve(mic.media);
    await Promise.resolve();
    const call = connections.at(-1)!;
    call.result.resolve({ started: true, assistantName: 'Ciel' });
    await promise;
    return { mic, callId: call.input.callId };
  }
  return {
    controller,
    microphones,
    connections,
    ends,
    stream,
    connect,
    playbackStops: () => stoppedPlayback
  };
}
test('cancel before microphone permission completes closes late media without starting a provider', async () => {
  const f = fixture();
  const start = f.controller.start({ channelId: 1 });
  const end = f.controller.end();
  assert.equal(f.controller.getSnapshot().phase, 'text');
  assert.equal(f.ends.length, 0);
  await end;
  const mic = f.stream();
  f.microphones[0].resolve(mic.media);
  await start;
  assert.equal(mic.track.stopped, 1);
  assert.equal(f.connections.length, 0);
  assert.equal(f.controller.getSnapshot().phase, 'text');
});
test('rapid same-conversation starts share one pending connection and wait for a server receipt', async () => {
  const f = fixture();
  const a = f.controller.start({ channelId: 1, topicId: 2 });
  const b = f.controller.start({ channelId: 1, topicId: 2 });
  assert.equal(a, b);
  assert.equal(f.microphones.length, 1);
  await assert.rejects(f.controller.start({ channelId: 1, topicId: 3 }));
  const mic = f.stream();
  f.microphones[0].resolve(mic.media);
  await Promise.resolve();
  assert.equal(f.controller.getSnapshot().phase, 'connecting');
  f.connections[0].result.resolve({ started: true });
  await a;
  assert.equal(f.controller.getSnapshot().phase, 'voice');
});
test('switching to text releases audio immediately while preserving session ownership until closed', async () => {
  const f = fixture();
  const { mic, callId } = await f.connect();
  f.controller.setMuted(true);
  assert.equal(mic.track.enabled, false);
  const a = f.controller.end(),
    b = f.controller.end();
  assert.equal(a, b);
  assert.equal(f.ends.length, 1);
  assert.equal(mic.track.stopped, 1);
  assert.ok(f.playbackStops());
  assert.equal(f.controller.getSnapshot().callId, callId);
  await assert.rejects(f.controller.start({ channelId: 2 }));
  f.ends[0].result.resolve();
  await a;
  assert.equal(f.controller.getSnapshot().phase, 'text');
  assert.equal(f.controller.getSnapshot().topicId, 3);
});
test('late events from an ended call cannot stop, unmute, or mark a new call speaking', async () => {
  const f = fixture();
  const first = await f.connect();
  f.controller.ended(first.callId);
  const next = await f.connect(2, 7);
  assert.equal(f.controller.ended(first.callId), false);
  assert.equal(f.controller.started(first.callId, 'Zero'), false);
  f.controller.setSpeaking(first.callId, true);
  assert.equal(f.controller.getSnapshot().speaking, false);
  assert.equal(f.controller.getSnapshot().callId, next.callId);
});
test('microphone denial leaves an explicit text fallback and never creates a provider session', async () => {
  const f = fixture();
  const started = f.controller.start({ channelId: 1 });
  const rejected = assert.rejects(started, /permission denied/);
  f.microphones[0].reject(new Error('permission denied'));
  await rejected;
  assert.equal(f.ends.length, 0);
  assert.equal(f.connections.length, 0);
  assert.equal(f.controller.getSnapshot().phase, 'text');
  assert.match(f.controller.getSnapshot().error, /permission denied/);
});
test('force-end can interrupt a slow handoff, and a late handoff acknowledgment is harmless', async () => {
  const f = fixture();
  await f.connect();
  const normal = f.controller.end();
  const force = f.controller.end(false);
  assert.equal(f.ends[1].handoff, false);
  f.ends[1].result.resolve();
  await force;
  const next = await f.connect(2);
  f.ends[0].result.resolve();
  await normal;
  assert.equal(f.controller.getSnapshot().callId, next.callId);
});
test('late start success after cancellation cannot reopen a microphone or change modes', async () => {
  const f = fixture();
  const started = f.controller.start({ channelId: 1 });
  const mic = f.stream();
  f.microphones[0].resolve(mic.media);
  await Promise.resolve();
  const ended = f.controller.end();
  f.ends[0].result.resolve();
  await ended;
  f.connections[0].result.resolve({ started: true });
  await started;
  assert.equal(f.controller.getSnapshot().phase, 'text');
  assert.equal(f.controller.getStream(), null);
});
test('disconnect stops media and never automatically reconnects on foreground or retry events', async () => {
  const f = fixture();
  const { mic, callId } = await f.connect();
  f.controller.disconnected();
  assert.equal(mic.track.stopped, 1);
  assert.equal(f.controller.started(callId, 'Ciel'), false);
  assert.equal(f.controller.getSnapshot().phase, 'ending');
  assert.equal(f.connections.length, 1);
  const cleanup = f.controller.end(false);
  assert.equal(f.controller.getSnapshot().phase, 'ending');
  f.ends[0].result.resolve();
  await cleanup;
  assert.equal(f.controller.getSnapshot().phase, 'text');
  assert.equal(f.connections.length, 1);
});

test('a call error releases audio but keeps text gated until final persistence is acknowledged', async () => {
  const f = fixture();
  const { mic, callId } = await f.connect();
  const ending = f.controller.end(false, 'Call interrupted');
  assert.equal(mic.track.stopped, 1);
  assert.equal(f.controller.getSnapshot().phase, 'ending');
  assert.equal(f.controller.getSnapshot().error, 'Call interrupted');
  f.controller.ended(callId);
  assert.equal(f.controller.getSnapshot().error, 'Call interrupted');
  f.ends[0].result.resolve();
  await ending;
  assert.equal(f.controller.getSnapshot().phase, 'text');
});
