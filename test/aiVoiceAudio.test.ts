import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { AiVoicePlayback } from '../src/helpers/aiVoicePlayback';

function playbackFixture() {
  const starts: {
    at: number;
    duration: number;
    stopped: boolean;
    disconnected: boolean;
  }[] = [];
  const context = {
    currentTime: 0,
    state: 'suspended',
    destination: {},
    resume: () => new Promise<void>(() => {}),
    close: async () => {},
    createGain: () => ({ gain: { value: 0 }, connect() {}, disconnect() {} }),
    createBuffer: (_channels: number, count: number, rate: number) => ({
      duration: count / rate,
      getChannelData: () => new Float32Array(count)
    }),
    createBufferSource: () => {
      const entry = { at: 0, duration: 0, stopped: false, disconnected: false };
      const source = {
        buffer: null as { duration: number } | null,
        onended: null,
        connect() {},
        disconnect() {
          entry.disconnected = true;
        },
        stop() {
          entry.stopped = true;
        },
        start(at: number) {
          entry.at = at;
          entry.duration = source.buffer!.duration;
          starts.push(entry);
        }
      };
      return source;
    }
  };
  return {
    context,
    starts,
    player: new AiVoicePlayback(context as unknown as AudioContext)
  };
}

test('ordinary network jitter stays continuous and initial resume cannot reorder packets', () => {
  const { context, starts, player } = playbackFixture();
  for (const receivedAt of [0, 0.13, 0.2, 0.34, 0.4]) {
    context.currentTime = receivedAt;
    player.enqueue(new Int16Array(2400).buffer);
  }
  assert.equal(
    starts.length,
    5,
    'scheduling does not await AudioContext resume'
  );
  assert.equal(starts[0].at, 0.06);
  for (let i = 1; i < starts.length; i++)
    assert.ok(
      Math.abs(starts[i].at - starts[i - 1].at - 0.1) < 1e-9,
      'no gap between packets'
    );
  context.currentTime = 2;
  player.enqueue(new Int16Array(2400).buffer);
  assert.equal(
    starts.at(-1)!.at,
    2.06,
    'a genuine gap resets the small cushion'
  );
  player.stop();
  assert.ok(starts.every((source) => source.stopped && source.disconnected));
  player.enqueue(new Int16Array(2400).buffer);
  assert.equal(
    starts.length,
    6,
    'late audio after hangup cannot resume playback'
  );
});

test('microphone batches by samples on the audio thread, including silence', () => {
  let Processor: any;
  const messages: Int16Array[] = [];
  class WorkletBase {
    port = { postMessage: (frame: Int16Array) => messages.push(frame.slice()) };
  }
  new Function(
    'AudioWorkletProcessor',
    'registerProcessor',
    'sampleRate',
    readFileSync(
      new URL('../public/js/audio-processor.js', import.meta.url),
      'utf8'
    )
  )(
    WorkletBase,
    (_name: string, implementation: any) => {
      Processor = implementation;
    },
    24_000
  );
  const processor = new Processor();
  const input = new Float32Array(128).fill(0.5);
  const output = new Float32Array(128);
  for (let i = 0; i < 75; i++) processor.process([[input]], [[output]]);
  assert.equal(messages.length, 8, '400ms becomes eight 50ms frames');
  assert.ok(
    messages.every(
      (frame) =>
        frame.length === 1200 && frame.every((sample) => sample === 16383)
    )
  );
  assert.ok(
    output.every((sample) => sample === 0),
    'microphone is never monitored through the speakers'
  );
  for (let i = 0; i < 75; i++) processor.process([[]], [[output]]);
  assert.equal(messages.length, 16);
  assert.ok(
    messages.slice(8).every((frame) => frame.every((sample) => sample === 0)),
    'silence keeps the Live timeline running'
  );
});
