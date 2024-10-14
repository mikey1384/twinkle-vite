import React, { useEffect, useRef } from 'react';
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    let audioBuffer: any[] | Iterable<number> = [];
    let startTime = Date.now();
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let audioWorkletNode: AudioWorkletNode | null = null;

    if (aiCallChannelId) {
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

              // Send AI UI information before sending audio data
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
  }, [aiCallChannelId]);

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  useEffect(() => {
    socket.on('ai_realtime_audio', handleOpenAIAudio);
    socket.on('ai_realtime_response_stopped', handleAssistantResponseStopped);
    socket.on('ai_realtime_input_received', sendAIUIInformation);

    socket.on('ai_memory_updated', handleAIMemoryUpdate);
    socket.on('ai_message_done', handleAIMessageDone);
    socket.on('new_ai_message_received', handleReceiveAIMessage);

    return function cleanUp() {
      socket.off('ai_realtime_audio', handleOpenAIAudio);
      socket.off(
        'ai_realtime_response_stopped',
        handleAssistantResponseStopped
      );
      socket.off('ai_realtime_input_received', sendAIUIInformation);
      socket.off('ai_memory_updated', handleAIMemoryUpdate);
      socket.off('ai_message_done', handleAIMessageDone);
      socket.off('new_ai_message_received', handleReceiveAIMessage);
    };

    function handleAssistantResponseStopped() {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      nextStartTimeRef.current = 0;
    }

    function handleOpenAIAudio(base64AudioDelta: string) {
      if (base64AudioDelta) {
        const audioBuffer = base64ToArrayBuffer(base64AudioDelta);
        if (audioBuffer.byteLength > 0) {
          playAudioChunk(audioBuffer);
        } else {
          console.error('Received empty audio buffer');
        }
      } else {
        console.error('Received empty base64 audio delta');
      }
    }

    async function playAudioChunk(arrayBuffer: ArrayBuffer) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new window.AudioContext({
            sampleRate: 24000
          });
        }

        const audioContext = audioContextRef.current;
        const decodedAudioBuffer = await createAudioBufferFromPCM(
          arrayBuffer,
          audioContext
        );

        const sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = decodedAudioBuffer;
        sourceNode.connect(audioContext.destination);

        const now = audioContext.currentTime;
        const duration = decodedAudioBuffer.duration;

        if (now < nextStartTimeRef.current) {
          sourceNode.start(nextStartTimeRef.current);
          nextStartTimeRef.current += duration;
        } else {
          sourceNode.start(now);
          nextStartTimeRef.current = now + duration;
        }
      } catch (error) {
        console.error('Error processing audio chunk:', error);
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

  function sendAIUIInformation() {
    const mainContent = document.getElementById('react-view');
    const modalContent = document.getElementById('modal');
    const outerLayerContent = document.getElementById('outer-layer');
    let essentialContent = '';

    if (mainContent) {
      essentialContent += 'MAIN CONTENT\n';
      essentialContent += '=============\n';
      essentialContent += extractEssentialHTML(mainContent);
      essentialContent += '\n\n';
    }

    if (modalContent) {
      essentialContent += 'MODAL CONTENT\n';
      essentialContent += '=============\n';
      essentialContent += extractEssentialHTML(modalContent);
      essentialContent += '\n\n';
    }

    if (outerLayerContent) {
      essentialContent += 'OUTER LAYER CONTENT\n';
      essentialContent += '====================\n';
      essentialContent += extractEssentialHTML(outerLayerContent);
    }

    essentialContent = essentialContent
      .replace(/<\/?div>/g, '-')
      .replace(/<\/?b[^>]*>/g, '')
      .replace(/<\/?span[^>]*>/g, '')
      .replace(/\s{2,}/g, '-')
      .trim();

    socket.emit('ai_ui_information_input', {
      uiInformation: essentialContent
    });

    function extractEssentialHTML(element: Element) {
      const clone = element.cloneNode(true) as Element;

      const cleanElement = (el: Element) => {
        const tagsToRemove = ['script', 'style'];
        const tagsToPreserve = ['button', 'input', 'textarea', 'select', 'svg'];

        const attrsToRemove = ['id', 'style', 'role', 'xmlns', 'viewBox'];

        tagsToRemove.forEach((tag) => {
          const elements = el.getElementsByTagName(tag);
          while (elements[0]) {
            elements[0]?.parentNode?.removeChild(elements[0]);
          }
        });

        const allElements = el.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const currentElement = allElements[i];
          Array.from(currentElement.attributes).forEach((attr) => {
            if (
              attrsToRemove.some((pattern) => {
                if (pattern.endsWith('*')) {
                  return currentElement.hasAttribute(pattern.slice(0, -1));
                }
                return attr.name === pattern;
              })
            ) {
              currentElement.removeAttribute(attr.name);
            }
          });
        }

        Array.from(el.querySelectorAll('*')).forEach((child) => {
          if (
            child instanceof Element &&
            !tagsToPreserve.includes(child.tagName.toLowerCase()) &&
            child.innerHTML.trim() === '' &&
            child.textContent?.trim() === '' &&
            !child.querySelector('svg')
          ) {
            child.parentNode?.removeChild(child);
          }
        });
      };

      cleanElement(clone);
      return clone.innerHTML;
    }
  }

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
