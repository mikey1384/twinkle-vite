// A small initial cushion absorbs ordinary packet jitter. Decode and schedule
// synchronously so a suspended AudioContext cannot reorder the first packets.
export const VOICE_PLAYBACK_LEAD_SECONDS = 0.06;

export class AiVoicePlayback {
  private nextStart = 0;
  private stopped = false;
  private gain: GainNode;
  private sources = new Set<AudioBufferSourceNode>();

  constructor(private context: AudioContext) {
    this.gain = context.createGain();
    this.gain.gain.value = 2.5;
    this.gain.connect(context.destination);
    if (context.state === 'suspended') {
      void context.resume().catch((error) => {
        if (!this.stopped) console.error('Unable to resume call audio:', error);
      });
    }
  }

  enqueue(pcmBytes: ArrayBuffer) {
    if (this.stopped || !pcmBytes.byteLength) return;
    const samples = new Int16Array(pcmBytes);
    const buffer = this.context.createBuffer(1, samples.length, 24_000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      channel[i] = (samples[i] / 32768) * 1.2;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    this.sources.add(source);
    source.onended = () => {
      source.disconnect();
      this.sources.delete(source);
    };
    const now = this.context.currentTime;
    const start =
      this.nextStart > now ? this.nextStart : now + VOICE_PLAYBACK_LEAD_SECONDS;
    source.start(start);
    this.nextStart = start + buffer.duration;
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    for (const source of this.sources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
    this.gain.disconnect();
    void this.context.close().catch(() => {});
  }
}
