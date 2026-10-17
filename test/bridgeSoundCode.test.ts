import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import {
  encodeSoundCode,
  LISTEN_CHUNK,
  newInstance,
  soundReceiver
} from '../src/containers/BridgeBuilderQuest/Checkin/soundCode';

// The sound check's code over sound (ggwave), phone speaker to phone mic,
// played here sample-for-sample in 1024-sample chunks like the page's
// listener. Real rooms are judged by the funnel's sound-check numbers.

const require = createRequire(import.meta.url);
const RATE = 48000;

let loaded: Promise<any> | null = null;
async function engine() {
  loaded =
    loaded ||
    (async () => {
      const gg = await require('ggwave')({ print: () => undefined, printErr: () => undefined });
      gg.disableLog();
      return { gg, tx: newInstance(gg, RATE) };
    })();
  return loaded;
}

// the microphone's whole chunks, like the page's ScriptProcessor
function listen(receiver: { push: (samples: Float32Array) => string }, samples: Float32Array) {
  const heard: string[] = [];
  for (let i = 0; i + LISTEN_CHUNK <= samples.length; i += LISTEN_CHUNK) {
    const code = receiver.push(samples.subarray(i, i + LISTEN_CHUNK));
    if (code) heard.push(code);
  }
  return heard;
}

// a burst between silences, scaled down and with random room noise
function room(burst: Float32Array, { gain, noise }: { gain: number; noise: number }) {
  // whole chunks, so back-to-back rooms are one unbroken stream
  const out = new Float32Array(Math.ceil((burst.length + RATE) / LISTEN_CHUNK) * LISTEN_CHUNK);
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < out.length; i += 1) {
    const signal = i >= RATE / 4 && i < RATE / 4 + burst.length ? burst[i - RATE / 4] * gain : 0;
    out[i] = signal + random() * noise;
  }
  return out;
}

test('one listener hears code after code (a refreshed code too), through a quieter, noisy room', async () => {
  const { gg, tx } = await engine();
  const burst = encodeSoundCode(gg, tx, 'K7QX2M');
  // about one second at 48 kHz
  assert.ok(burst.length > RATE * 0.8 && burst.length < RATE * 1.5, String(burst.length));
  const receiver = soundReceiver(gg, RATE);
  assert.deepEqual(listen(receiver, room(burst, { gain: 1, noise: 0 })), ['K7QX2M']);
  // the same listener keeps hearing: the next burst, and the next code
  assert.deepEqual(listen(receiver, room(burst, { gain: 0.3, noise: 0.02 })), ['K7QX2M']);
  assert.deepEqual(listen(receiver, room(encodeSoundCode(gg, tx, 'ABC234'), { gain: 0.5, noise: 0.01 })), ['ABC234']);
  receiver.close();
});

test('noise alone, or anything that is not a sound code, is never heard as one', async () => {
  const { gg, tx } = await engine();
  const receiver = soundReceiver(gg, RATE);
  assert.deepEqual(listen(receiver, room(new Float32Array(0), { gain: 1, noise: 0.2 })), []);
  // a valid transmission of some other text is ignored
  assert.deepEqual(listen(receiver, room(encodeSoundCode(gg, tx, 'hello!'), { gain: 1, noise: 0 })), []);
  receiver.close();
});
