class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];

    if (input && input[0]) {
      const inputChannelData = input[0];

      // Convert to Int16Array
      const int16Data = new Int16Array(inputChannelData.length);
      for (let i = 0; i < inputChannelData.length; i++) {
        int16Data[i] = inputChannelData[i] * 32767;
      }

      this.port.postMessage(int16Data);
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
