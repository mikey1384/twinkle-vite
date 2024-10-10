import React, { useEffect, useMemo, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useViewContext } from '~/contexts';
import {
  ZERO_PFP_URL,
  ZERO_TWINKLE_ID,
  CIEL_PFP_URL
} from '~/constants/defaultValues';

export default function useAISocket({
  selectedChannelId,
  usingChatRef,
  aiCallChannelId
}: {
  selectedChannelId: number;
  usingChatRef: React.MutableRefObject<boolean>;
  aiCallChannelId: number;
}) {
  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onSetTopicSettingsJSON = useChatContext(
    (v) => v.actions.onSetTopicSettingsJSON
  );
  const onSetChannelSettingsJSON = useChatContext(
    (v) => v.actions.onSetChannelSettingsJSON
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);

  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );

  // References for audio playback
  const audioDeltasRef = useRef<string[]>([]);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Determine if AI call is ongoing
  const aiCallOngoing = useMemo(() => {
    return selectedChannelId && selectedChannelId === aiCallChannelId;
  }, [aiCallChannelId, selectedChannelId]);

  useEffect(() => {
    let audioBuffer: any[] | Iterable<number> = [];
    let startTime = Date.now();
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let audioWorkletNode: AudioWorkletNode | null = null;

    if (aiCallOngoing) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(async (stream) => {
          mediaStream = stream;
          audioContext = new AudioContext({ sampleRate: 24000 });

          try {
            await audioContext.audioWorklet.addModule('/js/audio-processor.js');
          } catch (error) {
            console.error('Error loading audio processor module:', error);
          }

          const microphoneStream = audioContext.createMediaStreamSource(stream);
          audioWorkletNode = new AudioWorkletNode(
            audioContext,
            'audio-processor'
          );

          audioWorkletNode.port.onmessage = (event) => {
            const pcmData = event.data; // Int16Array
            // Append pcmData to audioBuffer
            if (Array.isArray(audioBuffer)) {
              audioBuffer.push(...pcmData);
            } else {
              audioBuffer = Array.from(audioBuffer).concat(pcmData);
            }

            // Send data every 100ms or when buffer reaches a certain size
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime >= 100) {
              const arrayBuffer = new Int16Array(audioBuffer).buffer;

              // Convert ArrayBuffer to base64
              const base64Audio = arrayBufferToBase64(arrayBuffer);

              socket.emit('ai_user_audio', base64Audio);

              // Reset buffer and timer
              audioBuffer = [];
              startTime = Date.now();
            }
          };

          microphoneStream.connect(audioWorkletNode);
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });
    }

    return () => {
      if (audioWorkletNode) {
        audioWorkletNode.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [aiCallOngoing]);

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Handle receiving audio and messages from the server
  useEffect(() => {
    socket.on('ai_realtime_audio', handleOpenAIAudio);
    socket.on('ai_realtime_audio_done', handleOpenAIAudioDone);
    socket.on('ai_realtime_response_stopped', handleAssistantResponseStopped);

    socket.on('ai_memory_updated', handleAIMemoryUpdate);
    socket.on('ai_message_done', handleAIMessageDone);
    socket.on('new_ai_message_received', handleReceiveAIMessage);

    return function cleanUp() {
      socket.off('ai_realtime_audio', handleOpenAIAudio);
      socket.off('ai_realtime_audio_done', handleOpenAIAudioDone);
      socket.off(
        'ai_realtime_response_stopped',
        handleAssistantResponseStopped
      );

      socket.off('ai_memory_updated', handleAIMemoryUpdate);
      socket.off('ai_message_done', handleAIMessageDone);
      socket.off('new_ai_message_received', handleReceiveAIMessage);
    };

    function handleAssistantResponseStopped() {
      // Stop any ongoing assistant audio playback
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      // Clear the audio queue
      audioQueueRef.current = [];
      // Reset playback flags
      isPlayingRef.current = false;
    }

    function handleOpenAIAudio(base64AudioDelta: string) {
      if (base64AudioDelta) {
        // Collect the base64 audio delta
        audioDeltasRef.current.push(base64AudioDelta);
      } else {
        console.error('Received empty base64 audio delta');
      }
    }

    function handleOpenAIAudioDone() {
      // Combine all collected audio deltas into one base64 string
      const combinedBase64Audio = audioDeltasRef.current.join('');

      // Clear the audio deltas for future use
      audioDeltasRef.current = [];

      // Decode the combined base64 audio data
      const audioBuffer = base64ToArrayBuffer(combinedBase64Audio);

      if (audioBuffer.byteLength === 0) {
        console.error('Combined audio buffer is empty');
        return;
      }

      // Add the audio buffer to the playback queue
      audioQueueRef.current.push(audioBuffer);

      // Start playback if not already playing
      if (!isPlayingRef.current) {
        playNextAudio();
      }
    }

    async function playNextAudio() {
      if (audioQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        return;
      }

      isPlayingRef.current = true;

      const audioBuffer = audioQueueRef.current.shift();
      if (!audioBuffer) {
        console.error('No audio buffer to play');
        isPlayingRef.current = false;
        return;
      }

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new window.AudioContext({
            sampleRate: 24000
          });
        }

        const decodedAudioBuffer = await createAudioBufferFromPCM(
          audioBuffer,
          audioContextRef.current
        );

        // Create source node and play audio
        const sourceNode = audioContextRef.current.createBufferSource();
        sourceNode.buffer = decodedAudioBuffer;
        sourceNode.connect(audioContextRef.current.destination);

        sourceNode.onended = () => {
          // Check if there's more audio to play
          if (audioQueueRef.current.length > 0) {
            playNextAudio();
          } else {
            // No more audio, reset flags and close AudioContext
            isPlayingRef.current = false;
            audioContextRef.current?.close();
            audioContextRef.current = null;
          }
        };

        sourceNode.start();
      } catch (error) {
        console.error('Error processing audio data:', error);
        isPlayingRef.current = false;
      }
    }

    function handleAIMemoryUpdate({
      channelId,
      topicId,
      memory
    }: {
      channelId: number;
      topicId?: number;
      memory: any;
    }) {
      if (topicId) {
        onSetTopicSettingsJSON({
          channelId,
          topicId,
          newSettings: { aiMemory: memory }
        });
      } else {
        onSetChannelSettingsJSON({
          channelId,
          newSettings: { aiMemory: memory }
        });
      }
    }

    function handleAIMessageDone(channelId: number) {
      onSetChannelState({
        channelId,
        newState: { currentlyStreamingAIMsgId: null }
      });
    }

    function handleReceiveAIMessage({
      message,
      channelId
    }: {
      message: any;
      channelId: number;
    }) {
      onSetChannelState({
        channelId,
        newState: {
          currentlyStreamingAIMsgId: message.id
        }
      });
      const messageIsForCurrentChannel = channelId === selectedChannelId;
      if (messageIsForCurrentChannel) {
        if (usingChatRef.current) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message: {
            ...message,
            profilePicUrl:
              message.userId === ZERO_TWINKLE_ID ? ZERO_PFP_URL : CIEL_PFP_URL
          },
          pageVisible,
          usingChat: usingChatRef.current
        });
      }
    }
  });

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function createAudioBufferFromPCM(
    arrayBuffer: ArrayBuffer,
    audioContext: AudioContext
  ): Promise<AudioBuffer> {
    // PCM16LE mono, sample rate 24000 Hz
    const pcm16Data = new Int16Array(arrayBuffer);
    const float32Data = new Float32Array(pcm16Data.length);

    for (let i = 0; i < pcm16Data.length; i++) {
      float32Data[i] = pcm16Data[i] / 32768; // Normalize to [-1, 1)
    }

    // Create an AudioBuffer with 1 channel, sample rate 24000 Hz
    const audioBuffer = audioContext.createBuffer(
      1, // Mono audio
      float32Data.length,
      24000 // Sample rate
    );

    // Copy the Float32Array data into the AudioBuffer
    audioBuffer.copyToChannel(float32Data, 0);

    return audioBuffer;
  }
}
