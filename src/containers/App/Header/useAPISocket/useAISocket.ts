import React, { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useNotiContext,
  useViewContext,
  useManagementContext
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
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);
  const onUpdateLastUsedFile = useChatContext(
    (v) => v.actions.onUpdateLastUsedFile
  );

  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );

  // Add Management context for subtitle translation progress
  const onSetSubtitleTranslationProgress = useManagementContext(
    (v) => v.actions.onSetSubtitleTranslationProgress
  );

  // Add Management context for subtitle merge progress
  const onSetSubtitleMergeProgress = useManagementContext(
    (v) => v.actions.onSetSubtitleMergeProgress
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

    socket.on('ai_message_done', handleAIMessageDone);
    socket.on('new_ai_message_received', handleReceiveAIMessage);
    socket.on('ai_call_duration_updated', handleAICallDurationUpdate);
    socket.on('ai_call_max_duration_reached', handleAICallMaxDurationReached);
    socket.on('last_used_file_updated', onUpdateLastUsedFile);
    socket.on('subtitle_translation_progress_update', handleSubtitleProgress);
    socket.on('subtitle_merge_progress_update', handleSubtitleMergeProgress);

    return function cleanUp() {
      socket.off('ai_realtime_audio', handleOpenAIAudio);
      socket.off(
        'ai_realtime_response_stopped',
        handleAssistantResponseStopped
      );
      socket.off('ai_realtime_input_received', sendAIUIInformation);
      socket.off('ai_message_done', handleAIMessageDone);
      socket.off('new_ai_message_received', handleReceiveAIMessage);
      socket.off('ai_call_duration_updated', handleAICallDurationUpdate);
      socket.off(
        'ai_call_max_duration_reached',
        handleAICallMaxDurationReached
      );
      socket.off('last_used_file_updated', onUpdateLastUsedFile);
      socket.off(
        'subtitle_translation_progress_update',
        handleSubtitleProgress
      );
      socket.off('subtitle_merge_progress_update', handleSubtitleMergeProgress);
    };

    function handleSubtitleProgress(data: {
      channelId: number;
      messageId: number;
      progress: number;
      stage: string;
      current?: number;
      total?: number;
      error?: string;
      warning?: string;
    }) {
      // Update the subtitle translation progress in the Management context
      onSetSubtitleTranslationProgress({
        progress: data.progress,
        stage: data.stage,
        current: data.current,
        total: data.total,
        error: data.error,
        warning: data.warning
      });

      // Also update channel state for the channel where this is happening
      onSetChannelState({
        channelId: data.channelId,
        newState: {
          subtitleTranslationProgress: {
            progress: data.progress,
            stage: data.stage,
            messageId: data.messageId,
            current: data.current,
            total: data.total,
            error: data.error,
            warning: data.warning
          }
        }
      });
    }

    function handleSubtitleMergeProgress(data: {
      progress: number;
      stage: string;
      error?: string;
    }) {
      // Update the subtitle merge progress in the Management context
      onSetSubtitleMergeProgress({
        progress: data.progress,
        stage: data.stage,
        error: data.error
      });
    }

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
  }

  function extractEssentialHTML(element: Element) {
    const clone = element.cloneNode(true) as Element;

    const cleanElement = (el: Element) => {
      const removeSelectors = [
        'script',
        'style',
        '.hidden',
        '[style*="display: none"]',
        '[style*="visibility: hidden"]'
      ];
      removeSelectors.forEach((selector) => {
        el.querySelectorAll(selector).forEach((elem) => elem.remove());
      });

      const allElements = el.getElementsByTagName('*');
      for (let i = allElements.length - 1; i >= 0; i--) {
        const elem = allElements[i];
        const computedStyle = window.getComputedStyle(elem);

        // Preserve layout information before removing attributes
        let layoutInfo = '';
        if (computedStyle.display === 'flex') {
          layoutInfo = `[flex ${computedStyle.flexDirection} ${computedStyle.justifyContent}]`;
        } else if (computedStyle.display === 'grid') {
          layoutInfo = '[grid]';
        }

        // A) If <svg> has data-icon or data-prefix => replace with [icon {prefix}-{iconName}]
        if (
          elem.tagName.toLowerCase() === 'svg' &&
          (elem.hasAttribute('data-icon') || elem.hasAttribute('data-prefix'))
        ) {
          const prefix = elem.getAttribute('data-prefix') || 'fas';
          const iconName = elem.getAttribute('data-icon') || 'unknown';
          const placeholderText = `[icon ${prefix}-${iconName}]`;
          const textNode = document.createTextNode(placeholderText);

          elem.parentNode?.insertBefore(textNode, elem);
          elem.remove();
          continue;
        }

        // B) Remove sub-elements like <path> if not replaced above
        if (elem.tagName.toLowerCase() === 'path') {
          elem.remove();
          continue;
        }

        if (!elem.textContent?.trim() && !hasInteractiveChild(elem)) {
          elem.remove();
          continue;
        }

        if (!isPreservedInteractiveElement(elem)) {
          // Add layout info before removing attributes if it exists
          if (layoutInfo) {
            const layoutNode = document.createTextNode(layoutInfo);
            elem.parentNode?.insertBefore(layoutNode, elem);
          }

          while (elem.attributes.length > 0) {
            elem.removeAttribute(elem.attributes[0].name);
          }
        }
      }
    };

    cleanElement(clone);
    const finalHTML = clone.innerHTML
      .replace(/<(article|section|main|aside|header|footer|nav)>/g, '[section]')
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
      .replace(/<\/?(?:span|strong|em|i|b|small|label)>/g, '')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/\n\s+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return finalHTML;
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

  function isPreservedInteractiveElement(elem: Element) {
    const interactiveSelectors = [
      'button',
      'input',
      'textarea',
      'select',
      'a[href]'
    ];
    return interactiveSelectors.some((selector) => elem.matches(selector));
  }

  function hasInteractiveChild(elem: Element) {
    const interactiveSelectors = [
      'button',
      'input',
      'textarea',
      'select',
      'a[href]'
    ];
    return !!elem.querySelector(interactiveSelectors.join(','));
  }
}
