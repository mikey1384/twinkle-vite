class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frame = new Int16Array(Math.round(sampleRate * 0.05));
    this.offset = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const length = input?.length || outputs[0]?.[0]?.length || 128;
    // Accumulate on the audio thread, including silence. The old path posted
    // every 128 samples and batched by the UI thread's wall clock.
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, input?.[i] || 0));
      this.frame[this.offset++] = sample < 0 ? sample * 32768 : sample * 32767;
      if (this.offset === this.frame.length) {
        this.port.postMessage(this.frame, [this.frame.buffer]);
        this.frame = new Int16Array(Math.round(sampleRate * 0.05));
        this.offset = 0;
      }
    }
    // Output remains silent; connection to the destination keeps capture alive.
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
