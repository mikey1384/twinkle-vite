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
import { useToast } from '~/contexts/Toast';
import { extractAiVoiceScreenHTML } from '~/helpers/aiVoiceScreen';
import { AiVoicePlayback } from '~/helpers/aiVoicePlayback';

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
  const showToast = useToast();
  const userId = useKeyContext((v) => v.myState.userId);
  const aiCallEnding = useChatContext((v) => v.state.aiCallEnding);
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

  const voicePlaybackRef = useRef<AiVoicePlayback | null>(null);
  const lastScreenInformationRef = useRef('');

  useEffect(() => {
    lastScreenInformationRef.current = '';
    if (!aiCallChannelId || aiCallEnding) return;
    // Keep navigation, scrolling, and modal changes current even before the
    // next transcript fragment arrives. Unchanged snapshots are not resent.
    const interval = window.setInterval(sendAIUIInformation, 2_000);
    return () => window.clearInterval(interval);
  }, [aiCallChannelId, aiCallEnding]);

  useEffect(() => {
    let cancelled = false;
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let audioWorkletNode: AudioWorkletNode | null = null;

    if (aiCallChannelId && !aiCallEnding) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          }
        })
        .then(async (stream) => {
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          mediaStream = stream;
          audioContext = new AudioContext({ sampleRate: 24000 });

          try {
            await audioContext.audioWorklet.addModule(
              '/js/audio-processor.js?v=2'
            );
          } catch (error) {
            throw new Error('Unable to prepare the microphone.', {
              cause: error
            });
          }
          if (cancelled) return;

          const microphoneStream = audioContext.createMediaStreamSource(stream);
          audioWorkletNode = new AudioWorkletNode(
            audioContext,
            'audio-processor'
          );

          audioWorkletNode.port.onmessage = (
            event: MessageEvent<Int16Array>
          ) => {
            if (cancelled || !socket.connected) return;
            socket.emit(
              'ai_user_audio',
              arrayBufferToBase64(event.data.buffer as ArrayBuffer)
            );
          };

          microphoneStream.connect(audioWorkletNode);
          // The processor's output is silence. Keep it connected so browsers
          // continue rendering the capture graph while the caller is quiet.
          audioWorkletNode.connect(audioContext.destination);
          await audioContext.resume();
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
          if (!cancelled) {
            mediaStream?.getTracks().forEach((track) => track.stop());
            showToast({
              message:
                'Unable to use your microphone. Check its permission and try the call again.'
            });
            socket.emit('ai_end_ai_voice_conversation');
          }
        });
    }

    return () => {
      cancelled = true;
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
    // Context dispatchers are stable and do not belong in dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiCallChannelId, aiCallEnding]);

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
    socket.on('ai_voice_session_started', handleAIVoiceSessionStarted);
    socket.on('disconnect', handleAIVoiceSessionEnded);
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
      socket.off('ai_voice_session_started', handleAIVoiceSessionStarted);
      socket.off('disconnect', handleAIVoiceSessionEnded);
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
      voicePlaybackRef.current?.stop();
      voicePlaybackRef.current = null;
    }

    function handleAICallMaxDurationReached() {
      onSetAICallEnding(false);
      onSetAICall(null);
      socket.emit('ai_end_ai_voice_conversation');
    }

    function handleAIVoiceSessionStarted({
      channelId,
      assistantName
    }: {
      channelId: number;
      assistantName: 'Zero' | 'Ciel';
    }) {
      aiCallChannelIdRef.current = channelId;
      onSetAICallEnding(false);
      onSetAICall(channelId, assistantName);
      sendAIUIInformation();
    }

    function handleAIVoiceSessionEnded() {
      aiCallChannelIdRef.current = 0;
      handleAssistantResponseStopped();
      onSetAICallEnding(false);
      onSetAICall(null);
    }

    function handleOpenAIAudio(base64AudioDelta: string) {
      if (!aiCallChannelIdRef.current) return;
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

    function playAudioChunk(arrayBuffer: ArrayBuffer) {
      try {
        voicePlaybackRef.current ||= new AiVoicePlayback(
          new window.AudioContext({
            sampleRate: 24_000,
            latencyHint: 'interactive'
          })
        );
        voicePlaybackRef.current.enqueue(arrayBuffer);
      } catch (error) {
        console.error('Error processing call audio:', error);
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
      aiUsagePolicy,
      error
    }: {
      aiUsagePolicy?: any;
      error?: string;
    } = {}) {
      if (aiUsagePolicy) {
        handleAiUsagePolicyUpdate({ aiUsagePolicy });
      }
      if (aiCallChannelIdRef.current && error) showToast({ message: error });
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
      essentialContent += extractAiVoiceScreenHTML(mainContent);
      essentialContent += '\n';
    }

    if (modalContent) {
      essentialContent += 'MODAL:\n';
      essentialContent += extractAiVoiceScreenHTML(modalContent);
      essentialContent += '\n';
    }

    if (outerLayerContent) {
      essentialContent += 'OVERLAY:\n';
      essentialContent += extractAiVoiceScreenHTML(outerLayerContent);
    }

    const uiInformation = essentialContent.trim();
    if (uiInformation === lastScreenInformationRef.current) return;
    lastScreenInformationRef.current = uiInformation;
    socket.emit('ai_ui_information_input', { uiInformation });
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
}
