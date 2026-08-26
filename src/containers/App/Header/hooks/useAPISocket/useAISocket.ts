import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '~/constants/sockets/api';
import { showDesktopNotification } from '~/helpers/desktopNotifications';
import { shouldShowBackgroundAiReplyNotification } from '~/helpers/chatNotificationPolicy';
import {
  useChatContext,
  useNotiContext,
  useViewContext,
  useManagementContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import {
  ZERO_PFP_URL,
  ZERO_TWINKLE_ID,
  CIEL_PFP_URL,
  CIEL_TWINKLE_ID,
  CHAT_ID_BASE_NUMBER
} from '~/constants/defaultValues';
import { markChatUnreadActivity } from '~/helpers/chatUnreadActivity';
import { chatRealtimeChannelNeedsCanonicalSummary } from '~/helpers/chatUnreadProjection';
import useChatLastReadReconciler from '~/helpers/hooks/useChatLastReadReconciler';

export default function useAISocket({
  activeChatChannelIdRef,
  usingChatRef,
  subchannelId,
  aiCallChannelId
}: {
  activeChatChannelIdRef: React.RefObject<number | null>;
  usingChatRef: React.RefObject<boolean>;
  subchannelId: number;
  aiCallChannelId: number;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );
  const { reconcileChannelLastRead, reconcileChannelUnreadActivity } =
    useChatLastReadReconciler();
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onFinishAIMessage = useChatContext((v) => v.actions.onFinishAIMessage);
  const onConfirmCanonicalAIGeneration = useChatContext(
    (v) => v.actions.onConfirmCanonicalAIGeneration
  );
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const homeChannelIds = useChatContext((v) => v.state.homeChannelIds);
  const favoriteChannelIds = useChatContext((v) => v.state.favoriteChannelIds);
  const classChannelIds = useChatContext((v) => v.state.classChannelIds);
  const chatNotificationSettings = useChatContext(
    (v) => v.state.chatNotificationSettings
  );
  const onSetAICall = useChatContext((v) => v.actions.onSetAICall);
  const onSetAICallEnding = useChatContext((v) => v.actions.onSetAICallEnding);
  const onUpdateAIGeneratedFile = useChatContext(
    (v) => v.actions.onUpdateAIGeneratedFile
  );
  const onApplyCanonicalAIMessageFailure = useChatContext(
    (v) => v.actions.onApplyCanonicalAIMessageFailure
  );

  const channelsObjRef = useRef(channelsObj);
  const listedChannelIdsRef = useRef(new Set<number>());
  const pendingAIReplyRef = useRef<
    Record<
      number,
      { aiName: string; messageId: number; pathId: number; topicId: number }
    >
  >({});
  const scheduledAIReplyNotifyRef = useRef<
    Record<number, { timer: ReturnType<typeof setTimeout>; messageId: number }>
  >({});
  const pageVisibleRef = useRef(pageVisible);
  const subchannelIdRef = useRef(subchannelId);
  const aiCallChannelIdRef = useRef(aiCallChannelId);
  const chatNotificationSettingsRef = useRef(chatNotificationSettings);
  const userIdRef = useRef(userId);
  channelsObjRef.current = channelsObj;
  listedChannelIdsRef.current = new Set(
    [
      ...(homeChannelIds || []),
      ...(favoriteChannelIds || []),
      ...(classChannelIds || [])
    ].map(Number)
  );
  pageVisibleRef.current = pageVisible;
  subchannelIdRef.current = subchannelId;
  aiCallChannelIdRef.current = aiCallChannelId;
  chatNotificationSettingsRef.current = chatNotificationSettings;
  userIdRef.current = userId;
  const onUpdateLastUsedFiles = useChatContext(
    (v) => v.actions.onUpdateLastUsedFiles
  );

  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );

  const onUpdateGrammarLoadingStatus = useHomeContext(
    (v) => v.actions.onUpdateGrammarLoadingStatus
  );
  const onUpdateGrammarGenerationProgress = useHomeContext(
    (v) => v.actions.onUpdateGrammarGenerationProgress
  );

  const onSetSubtitleTranslationProgress = useManagementContext(
    (v) => v.actions.onSetSubtitleTranslationProgress
  );

  const onSetSubtitleMergeProgress = useManagementContext(
    (v) => v.actions.onSetSubtitleMergeProgress
  );

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
            if (Array.isArray(audioBuffer)) {
              audioBuffer.push(...pcmData);
            } else {
              audioBuffer = Array.from(audioBuffer).concat(pcmData);
            }

            const elapsedTime = Date.now() - startTime;
            if (elapsedTime >= 100) {
              const arrayBuffer = new Int16Array(audioBuffer).buffer;

              const base64Audio = arrayBufferToBase64(arrayBuffer);

              socket.emit('ai_user_audio', base64Audio);

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
    socket.on('chat_message_deleted', handleAIMessageDiscardedForNotify);
    socket.on('new_ai_message_received', handleReceiveAIMessage);
    socket.on('ai_message_error', handleAIMessageError);
    socket.on('ai_call_duration_updated', handleAICallDurationUpdate);
    socket.on('ai_usage_policy_updated', handleAiUsagePolicyUpdate);
    socket.on('ai_voice_error', handleAIVoiceError);
    socket.on('ai_call_max_duration_reached', handleAICallMaxDurationReached);
    socket.on('openai_voice_session_ended', handleAIVoiceSessionEnded);
    socket.on('last_used_files_updated', onUpdateLastUsedFiles);
    socket.on('grammar_generation_progress_update', handleGrammarProgress);
    socket.on('subtitle_translation_progress_update', handleSubtitleProgress);
    socket.on('subtitle_merge_progress_update', handleSubtitleMergeProgress);
    socket.on('ai_file_generated', handleAIFileGenerated);

    return function cleanUp() {
      socket.off('ai_realtime_audio', handleOpenAIAudio);
      socket.off(
        'ai_realtime_response_stopped',
        handleAssistantResponseStopped
      );
      socket.off('ai_realtime_input_received', sendAIUIInformation);
      socket.off('ai_message_done', handleAIMessageDone);
      socket.off('chat_message_deleted', handleAIMessageDiscardedForNotify);
      for (const scheduled of Object.values(
        scheduledAIReplyNotifyRef.current
      )) {
        clearTimeout(scheduled.timer);
      }
      scheduledAIReplyNotifyRef.current = {};
      pendingAIReplyRef.current = {};
      socket.off('new_ai_message_received', handleReceiveAIMessage);
      socket.off('ai_message_error', handleAIMessageError);
      socket.off('ai_call_duration_updated', handleAICallDurationUpdate);
      socket.off('ai_usage_policy_updated', handleAiUsagePolicyUpdate);
      socket.off('ai_voice_error', handleAIVoiceError);
      socket.off(
        'ai_call_max_duration_reached',
        handleAICallMaxDurationReached
      );
      socket.off('openai_voice_session_ended', handleAIVoiceSessionEnded);
      socket.off('last_used_files_updated', onUpdateLastUsedFiles);
      socket.off('grammar_generation_progress_update', handleGrammarProgress);
      socket.off(
        'subtitle_translation_progress_update',
        handleSubtitleProgress
      );
      socket.off('subtitle_merge_progress_update', handleSubtitleMergeProgress);
      socket.off('ai_file_generated', handleAIFileGenerated);
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
      onSetSubtitleTranslationProgress({
        progress: data.progress,
        stage: data.stage,
        current: data.current,
        total: data.total,
        error: data.error,
        warning: data.warning
      });

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
    function handleGrammarProgress(data: { current: number; total: number }) {
      try {
        const { current, total } = data || { current: 0, total: 10 };
        const clamped = Math.max(0, Math.min(current, total));
        const modalRoot = document.getElementById('modal');
        const hasOpenModal = !!(modalRoot && modalRoot.children.length > 0);
        if (!hasOpenModal) {
          onUpdateGrammarLoadingStatus('');
          onUpdateGrammarGenerationProgress(null);
          return;
        }
        onUpdateGrammarLoadingStatus('');
        if (total && clamped >= total) {
          onUpdateGrammarGenerationProgress(null);
        } else {
          onUpdateGrammarGenerationProgress({ current: clamped, total });
        }
      } catch {
        // no-op
      }
    }

    function handleSubtitleMergeProgress(data: {
      progress: number;
      stage: string;
      error?: string;
    }) {
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
      onSetAICallEnding(false);
      onSetAICall(null);
      socket.emit('ai_end_ai_voice_conversation');
    }

    function handleAIVoiceSessionEnded() {
      handleAssistantResponseStopped();
      onSetAICallEnding(false);
      onSetAICall(null);
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

        gainNode.gain.value = 2.5;

        sourceNode.buffer = decodedAudioBuffer;

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

        if (audioContext.state !== 'running') {
          await audioContext.resume();
        }
      } catch (error) {
        console.error('Error processing audio chunk:', error);
      }
    }

    function handleAIMessageDone(channelId: number, messageId?: number) {
      const normalizedMessageId = Number(messageId || 0);
      const pendingReply = pendingAIReplyRef.current[channelId];
      onFinishAIMessage({
        channelId,
        messageId: normalizedMessageId || undefined
      });
      if (
        !pendingReply ||
        (normalizedMessageId && pendingReply.messageId !== normalizedMessageId)
      ) {
        return;
      }
      delete pendingAIReplyRef.current[channelId];
      if (!document.hidden) return;
      // The terminal error/delete event normally arrives before done. Keep a
      // short grace period for rolling deployments and network reordering.
      cancelScheduledAIReplyNotification({ channelId });
      scheduledAIReplyNotifyRef.current[channelId] = {
        messageId: pendingReply.messageId,
        timer: setTimeout(() => {
          delete scheduledAIReplyNotifyRef.current[channelId];
          if (
            !document.hidden ||
            !shouldShowBackgroundAiReplyNotification({
              channelId,
              settings: chatNotificationSettingsRef.current,
              userId: userIdRef.current
            })
          ) {
            return;
          }
          showDesktopNotification({
            title: `${pendingReply.aiName} replied`,
            body: 'Click to view the reply',
            tag: `chat-${channelId}`,
            onClick: () =>
              navigate(
                `/chat/${pendingReply.pathId}${
                  pendingReply.topicId ? `/topic/${pendingReply.topicId}` : ''
                }`
              )
          });
        }, 2000)
      };
    }

    function cancelScheduledAIReplyNotification({
      channelId,
      messageId
    }: {
      channelId: number;
      messageId?: number;
    }) {
      const scheduled = scheduledAIReplyNotifyRef.current[channelId];
      if (!scheduled) return;
      if (messageId && scheduled.messageId !== messageId) return;
      clearTimeout(scheduled.timer);
      delete scheduledAIReplyNotifyRef.current[channelId];
    }

    function handleAIMessageDiscardedForNotify({
      channelId,
      messageId
    }: {
      channelId: number;
      messageId: number;
    }) {
      if (pendingAIReplyRef.current[channelId]?.messageId === messageId) {
        delete pendingAIReplyRef.current[channelId];
      }
      cancelScheduledAIReplyNotification({ channelId, messageId });
    }

    function handleReceiveAIMessage({
      message,
      channelId
    }: {
      message: any;
      channelId: number;
    }) {
      const currentChannelsObj = channelsObjRef.current;
      const currentPageVisible = pageVisibleRef.current;
      const currentSubchannelId = Number(subchannelIdRef.current || 0);
      const channelState = currentChannelsObj[channelId];
      const channelSummaryIsNeeded = chatRealtimeChannelNeedsCanonicalSummary({
        channel: channelState,
        isListed: listedChannelIdsRef.current.has(Number(channelId))
      });
      // AI replies use their own socket event and never pass through the
      // generic chat receipt handler. Invalidate older writer snapshots before
      // either applying this message or reconciling its read watermark.
      markChatUnreadActivity();
      if (channelState?.id) {
        onConfirmCanonicalAIGeneration({ channelId, message });
      }
      const isZeroMessage = message.userId === ZERO_TWINKLE_ID;
      const computedPathId =
        currentChannelsObj[channelId]?.pathId ??
        Number(channelId) + Number(CHAT_ID_BASE_NUMBER);
      const existingPendingReply = pendingAIReplyRef.current[channelId];
      if (
        !existingPendingReply ||
        Number(message.id || 0) >= Number(existingPendingReply.messageId || 0)
      ) {
        pendingAIReplyRef.current[channelId] = {
          aiName: isZeroMessage ? 'Zero' : 'Ciel',
          messageId: message.id,
          pathId: computedPathId,
          topicId: Number(message.subjectId || message.targetSubject?.id) || 0
        };
      }
      const messageIsForActiveChannel =
        channelId === activeChatChannelIdRef.current;
      const messageScopeIsActivelyVisible = Boolean(
        messageIsForActiveChannel &&
        currentPageVisible &&
        usingChatRef.current &&
        currentSubchannelId === 0
      );
      const appliedMessage = {
        ...message,
        channelId,
        profilePicUrl:
          message.userId === ZERO_TWINKLE_ID ? ZERO_PFP_URL : CIEL_PFP_URL
      };
      if (messageScopeIsActivelyVisible) {
        // The AI placeholder was persisted before this server event, but it is
        // not in channelsObj until the reducer below runs. Carry that exact
        // confirmed id into the writer-backed read mutation so the arriving
        // reply, rather than only the previous message, becomes read.
        void reconcileChannelLastRead(channelId, appliedMessage);
        onReceiveMessage({
          message: appliedMessage,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          currentSubchannelId
        });
      } else if (messageIsForActiveChannel) {
        // The selected channel remains mounted while Safari is hidden or the
        // user is on another section. Do not mark that unseen AI reply read;
        // hydrate its scoped and global unread projections from the writer.
        void reconcileChannelUnreadActivity({
          channelId,
          includeChannelSummary: channelSummaryIsNeeded
        });
        onReceiveMessage({
          message: appliedMessage,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          currentSubchannelId
        });
      } else {
        void reconcileChannelUnreadActivity({
          channelId,
          includeChannelSummary: channelSummaryIsNeeded
        });
        const prevChannelObj = currentChannelsObj[channelId];
        const aiUsername = isZeroMessage ? 'Zero' : 'Ciel';
        const aiUserId = isZeroMessage ? ZERO_TWINKLE_ID : CIEL_TWINKLE_ID;
        const aiProfilePicUrl = isZeroMessage ? ZERO_PFP_URL : CIEL_PFP_URL;
        onReceiveMessageOnDifferentChannel({
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          isMyMessage: false,
          deferChannelListProjection: channelSummaryIsNeeded,
          message: appliedMessage,
          channel: {
            id: channelId,
            pathId: computedPathId,
            channelName: prevChannelObj?.channelName || aiUsername,
            twoPeople: prevChannelObj?.twoPeople ?? true,
            members: prevChannelObj?.members || [
              {
                id: aiUserId,
                username: aiUsername,
                profilePicUrl: aiProfilePicUrl
              }
            ],
            isHidden: false
          }
        });
        if (!channelState?.id) {
          // Keep the confirmed placeholder and subsequent stream deltas in a
          // non-rendered cache while the canonical summary decides whether
          // this channel belongs in the sidebar.
          onConfirmCanonicalAIGeneration({ channelId, message });
        }
      }
    }

    function handleAIMessageError({
      channelId,
      messageId,
      content,
      error,
      errorType,
      settings
    }: {
      channelId: number;
      messageId: number;
      content?: string;
      error?: string;
      errorType?: 'moderation' | 'general';
      settings?: Record<string, unknown>;
    }) {
      handleAIMessageDiscardedForNotify({ channelId, messageId });
      if (settings) {
        onApplyCanonicalAIMessageFailure({
          channelId,
          messageId,
          content,
          settings
        });
      } else {
        onFinishAIMessage({ channelId, messageId });
        console.error('AI message failure lacked canonical settings', {
          channelId,
          messageId,
          error: error || 'An error occurred',
          errorType: errorType || 'general'
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

    function handleAiUsagePolicyUpdate({
      aiUsagePolicy
    }: {
      aiUsagePolicy: any;
    }) {
      onUpdateTodayStats({
        newStats: {
          aiUsagePolicy
        }
      });
    }

    function handleAIVoiceError({
      aiUsagePolicy
    }: {
      aiUsagePolicy?: any;
    } = {}) {
      if (aiUsagePolicy) {
        handleAiUsagePolicyUpdate({ aiUsagePolicy });
      }
      handleAIVoiceSessionEnded();
    }

    function handleAIFileGenerated({
      channelId,
      messageId,
      file
    }: {
      channelId: number;
      messageId: number;
      file: {
        fileName: string;
        filePath: string;
        fileSize: number;
      };
    }) {
      onUpdateAIGeneratedFile({
        channelId,
        messageId,
        fileName: file.fileName,
        filePath: file.filePath,
        fileSize: file.fileSize
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sendAIUIInformation() {
    if (!aiCallChannelIdRef.current) {
      return;
    }
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

        let layoutInfo = '';
        if (computedStyle.display === 'flex') {
          layoutInfo = `[flex ${computedStyle.flexDirection} ${computedStyle.justifyContent}]`;
        } else if (computedStyle.display === 'grid') {
          layoutInfo = '[grid]';
        }

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

        if (elem.tagName.toLowerCase() === 'path') {
          elem.remove();
          continue;
        }

        if (!elem.textContent?.trim() && !hasInteractiveChild(elem)) {
          elem.remove();
          continue;
        }

        if (!isPreservedInteractiveElement(elem)) {
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
