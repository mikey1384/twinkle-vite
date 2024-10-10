class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const inputData = input[0];

      // Convert Float32Array to Int16Array (PCM 16-bit)
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        let s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.port.postMessage(pcmData);
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
