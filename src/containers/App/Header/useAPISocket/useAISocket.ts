import React, { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useNotiContext,
  useViewContext
} from '~/contexts';
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
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);

  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );

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
        .getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          }
        })
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
    socket.on('ai_call_duration_updated', handleAICallDurationUpdate);
    socket.on('ai_call_max_duration_reached', handleAICallMaxDurationReached);

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
      socket.off('ai_call_duration_updated', handleAICallDurationUpdate);
      socket.off(
        'ai_call_max_duration_reached',
        handleAICallMaxDurationReached
      );
    };

    function handleAssistantResponseStopped() {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      nextStartTimeRef.current = 0;
    }

    function handleAICallMaxDurationReached() {
      onSetAICall(null);
      socket.emit('ai_end_ai_voice_conversation');
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
            sampleRate: 24000,
            latencyHint: 'interactive'
          });

          // Resume audio context on mobile
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }

        const audioContext = audioContextRef.current;
        const decodedAudioBuffer = await createAudioBufferFromPCM(
          arrayBuffer,
          audioContext
        );

        const sourceNode = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        // Increase the gain/volume
        gainNode.gain.value = 2.5;

        sourceNode.buffer = decodedAudioBuffer;

        // Connect source -> gain -> destination
        sourceNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const now = audioContext.currentTime;
        const duration = decodedAudioBuffer.duration;

        if (now < nextStartTimeRef.current) {
          sourceNode.start(nextStartTimeRef.current);
          nextStartTimeRef.current += duration;
        } else {
          sourceNode.start(now);
          nextStartTimeRef.current = now + duration;
        }

        // Force audio context to be running
        if (audioContext.state !== 'running') {
          await audioContext.resume();
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

    function handleAICallDurationUpdate({
      totalDuration
    }: {
      totalDuration: number;
    }) {
      onUpdateTodayStats({
        newStats: {
          aiCallDuration: totalDuration
        }
      });
    }
  });

  function sendAIUIInformation() {
    const mainContent = document.getElementById('react-view');
    const modalContent = document.getElementById('modal');
    const outerLayerContent = document.getElementById('outer-layer');
    let essentialContent = '';

    if (mainContent) {
      essentialContent += 'MAIN:\n';
      essentialContent += extractEssentialHTML(mainContent);
      essentialContent += '\n';
    }

    if (modalContent) {
      essentialContent += 'MODAL:\n';
      essentialContent += extractEssentialHTML(modalContent);
      essentialContent += '\n';
    }

    if (outerLayerContent) {
      essentialContent += 'OVERLAY:\n';
      essentialContent += extractEssentialHTML(outerLayerContent);
    }

    socket.emit('ai_ui_information_input', {
      uiInformation: essentialContent.trim()
    });

    function extractEssentialHTML(element: Element) {
      const clone = element.cloneNode(true) as Element;

      const cleanElement = (el: Element) => {
        // Elements to completely remove
        const removeSelectors = [
          'script',
          'style',
          '[aria-hidden="true"]',
          '.hidden',
          '[style*="display: none"]',
          '[style*="visibility: hidden"]'
        ];

        // Important interactive elements to preserve
        const preserveSelectors = [
          'button',
          'input',
          'textarea',
          'select',
          'a[href]',
          'svg',
          'path'
        ];

        // Important layout containers to preserve
        const layoutSelectors = [
          '.flex',
          '.grid',
          '.container',
          '[class*="flex"]',
          '[class*="grid"]',
          '[style*="display: flex"]',
          '[style*="display: grid"]'
        ];

        // Remove non-essential elements
        removeSelectors.forEach((selector) => {
          el.querySelectorAll(selector).forEach((elem) => elem.remove());
        });

        // Clean up all elements
        const allElements = el.getElementsByTagName('*');
        for (let i = allElements.length - 1; i >= 0; i--) {
          const elem = allElements[i];
          const computedStyle = window.getComputedStyle(elem);
          const isLayoutContainer = layoutSelectors.some((selector) =>
            elem.matches(selector)
          );

          // Preserve layout information for flex/grid containers
          if (isLayoutContainer) {
            const layoutInfo = {
              display: computedStyle.display,
              flexDirection: computedStyle.flexDirection,
              justifyContent: computedStyle.justifyContent,
              alignItems: computedStyle.alignItems,
              gridTemplateColumns: computedStyle.gridTemplateColumns,
              position: computedStyle.position,
              float: computedStyle.float
            };

            // Add layout information as a data attribute
            elem.setAttribute('data-layout', JSON.stringify(layoutInfo));
          }

          // Special handling for SVGs - keep only essential attributes
          if (elem.tagName.toLowerCase() === 'svg') {
            const keepSvgAttrs = ['viewBox', 'width', 'height'];
            Array.from(elem.attributes).forEach((attr) => {
              if (!keepSvgAttrs.includes(attr.name)) {
                elem.removeAttribute(attr.name);
              }
            });
            continue;
          }

          // For path elements in SVGs, only keep the 'd' attribute
          if (elem.tagName.toLowerCase() === 'path') {
            const d = elem.getAttribute('d');
            while (elem.attributes.length > 0) {
              elem.removeAttribute(elem.attributes[0].name);
            }
            if (d) elem.setAttribute('d', d);
            continue;
          }

          // Keep important interactive elements
          if (preserveSelectors.some((selector) => elem.matches(selector))) {
            const keepAttrs = [
              'type',
              'placeholder',
              'value',
              'href',
              'disabled'
            ];
            Array.from(elem.attributes).forEach((attr) => {
              if (!keepAttrs.includes(attr.name)) {
                elem.removeAttribute(attr.name);
              }
            });
            continue;
          }

          // Remove empty elements (except SVGs)
          if (
            !elem.tagName.toLowerCase().match(/^(svg|path)$/) &&
            !elem.textContent?.trim()
          ) {
            elem.remove();
            continue;
          }

          // Strip all attributes from non-interactive elements
          while (elem.attributes.length > 0) {
            elem.removeAttribute(elem.attributes[0].name);
          }
        }
      };

      cleanElement(clone);

      // Final cleanup of the HTML string, being careful with SVGs
      return (
        clone.innerHTML
          // Replace block-level elements with markers indicating structure
          .replace(
            /<(article|section|main|aside|header|footer|nav)>/g,
            '[section]'
          )
          .replace(
            /<\/(article|section|main|aside|header|footer|nav)>/g,
            '[/section]'
          )
          .replace(/<(h[1-6])>/g, '[heading]')
          .replace(/<\/h[1-6]>/g, '[/heading]')
          .replace(/<(ul|ol)>/g, '[list]')
          .replace(/<\/(ul|ol)>/g, '[/list]')
          .replace(/<li>/g, '• ')
          .replace(/<\/li>/g, '\n')
          .replace(/<div>/g, '')
          .replace(/<\/div>/g, '\n')
          .replace(/<p>/g, '')
          .replace(/<\/p>/g, '\n')
          // Remove inline elements completely
          .replace(/<\/?(?:span|strong|em|i|b|small|label)>/g, '')
          // Preserve line breaks
          .replace(/<br\s*\/?>/g, '\n')
          // Clean up whitespace while preserving structure
          .replace(/\n\s+/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s{2,}/g, ' ')
          // Add markers for layout containers
          .replace(
            /<([^>]+)data-layout="([^"]+)"([^>]*)>/g,
            (_, tag, layout) => {
              const layoutInfo = JSON.parse(layout);
              return `[layout type="${layoutInfo.display}" direction="${layoutInfo.flexDirection}" justify="${layoutInfo.justifyContent}" align="${layoutInfo.alignItems}"]`;
            }
          )
          .replace(/<\/(?:div|section|article)>/g, '[/layout]\n')
          .trim()
      );
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
    const pcm16Data = new Int16Array(arrayBuffer);
    const float32Data = new Float32Array(pcm16Data.length);

    for (let i = 0; i < pcm16Data.length; i++) {
      float32Data[i] = (pcm16Data[i] / 32768) * 1.2;
    }

    const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);

    audioBuffer.copyToChannel(float32Data, 0);
    return audioBuffer;
  }
}
