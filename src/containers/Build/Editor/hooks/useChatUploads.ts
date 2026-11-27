import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { formatBuildAppReferenceMessage } from '../helpers/appReferences';
import { formatBuildCommentFeedbackMessage } from '~/helpers/buildCommentFeedback';
import useChatDraft from './useChatDraft';
import { cloudFrontURL } from '~/constants/defaultValues';
import { generateFileName } from '~/helpers/stringHelpers';
import { v1 as uuidv1 } from 'uuid';
import type { UploadCompletionMeta } from '~/types';
import {
  BUILD_CHAT_HIDDEN_REFERENCE_CONTEXT_PREFIX,
  buildBuildChatHiddenMessageContext,
  buildBuildChatUploadPendingMessage,
  buildBuildChatUploadRouteProgressMessage,
  buildBuildChatUploadRouteProgressPercent,
  buildBuildChatUploadRoutingMessage,
  getReferenceDocumentUploadMimeType,
  isAudioChatAttachmentFile,
  isImageChatReferenceFile,
  isReferenceDocumentChatFile
} from '../helpers/chatUploads';
import {
  extractVideoReferenceFrames,
  getVideoFrameCountPerFile,
  isVideoChatReferenceFile
} from '../helpers/videoReferenceFrames';
import type {
  Build,
  BuildChatFileSelectionResult,
  BuildChatUploadDecision,
  BuildChatUploadHandling,
  BuildPlanAction,
  BuildPromptBinding,
  ChatMessage
} from '../types';

interface SendBuildMessageOptions {
  planAction?: BuildPlanAction | null;
  promptBinding?: BuildPromptBinding | null;
  messageContext?: string | null;
  existingUserMessageId?: number | null;
  ignoreUploadInFlight?: boolean;
}

interface UseBuildEditorChatUploadsOptions {
  appendLocalBuildChatAssistantMessage: (text: string) => number | null;
  build: Build;
  cleanupBuildChatReferenceUploads: (
    options: Record<string, any>
  ) => Promise<any>;
  createBuildChatAssistantNote: (options: Record<string, any>) => Promise<any>;
  createBuildChatReferenceNote: (options: Record<string, any>) => Promise<any>;
  createBuildChatReferenceDocuments: (
    options: Record<string, any>
  ) => Promise<any>;
  getLatestBuild: () => Build;
  getLatestChatMessages: () => ChatMessage[];
  isOwner: boolean;
  isRunActivityInFlight: () => boolean;
  onForceChatAutoScroll: () => void;
  replaceChatMessages: (messages: ChatMessage[]) => void;
  routeBuildChatUpload: (options: Record<string, any>) => Promise<any>;
  saveFileData: (options: Record<string, any>) => Promise<any>;
  sendBuildMessageText: (
    messageText: string,
    options?: SendBuildMessageOptions
  ) => Promise<boolean>;
  uploadFile: (options: Record<string, any>) => Promise<any>;
  userId: number;
}

export default function useChatUploads({
  appendLocalBuildChatAssistantMessage,
  build,
  cleanupBuildChatReferenceUploads,
  createBuildChatAssistantNote,
  createBuildChatReferenceNote,
  createBuildChatReferenceDocuments,
  getLatestBuild,
  getLatestChatMessages,
  isOwner,
  isRunActivityInFlight,
  onForceChatAutoScroll,
  replaceChatMessages,
  routeBuildChatUpload,
  saveFileData,
  sendBuildMessageText,
  uploadFile,
  userId
}: UseBuildEditorChatUploadsOptions) {
  const prepareBuildChatAppReferences = useAppContext(
    (v) => v.requestHelpers.prepareBuildChatAppReferences
  );
  const {
    buildChatDraftMessage,
    setBuildChatDraftMessage,
    buildChatDraftApps,
    setBuildChatDraftApps,
    buildChatDraftFeedback,
    setBuildChatDraftFeedback
  } = useChatDraft(userId, build.id);
  const [buildChatUploadModalShown, setBuildChatUploadModalShown] =
    useState(false);
  const [buildChatUploadFileObj, setBuildChatUploadFileObj] = useState<
    File | File[] | null
  >(null);
  const [buildChatUploadInFlight, setBuildChatUploadInFlight] = useState(false);
  const buildChatUploadProgressMessageIdRef = useRef<number | null>(null);

  useEffect(() => {
    setBuildChatUploadModalShown(false);
    setBuildChatUploadFileObj(null);
    setBuildChatUploadInFlight(false);
    buildChatUploadProgressMessageIdRef.current = null;
  }, [build.id, userId]);

  function appendPersistedBuildChatMessage(
    message: any,
    options?: { buildId?: number | null }
  ) {
    const persistedMessage = message
      ? {
          ...message,
          persisted: true,
          streamCodePreview: null
        }
      : null;
    if (!persistedMessage?.id) {
      return;
    }
    if (
      String(persistedMessage.content || '')
        .trim()
        .startsWith(BUILD_CHAT_HIDDEN_REFERENCE_CONTEXT_PREFIX)
    ) {
      return;
    }
    const targetBuildId = Number(options?.buildId || 0);
    if (
      targetBuildId > 0 &&
      Number(getLatestBuild()?.id || 0) !== targetBuildId
    ) {
      return;
    }
    const existingIds = new Set(
      getLatestChatMessages().map((entry) => entry.id)
    );
    if (existingIds.has(persistedMessage.id)) {
      return;
    }
    const nextMessages = [...getLatestChatMessages(), persistedMessage].sort(
      (a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt - b.createdAt;
        }
        return a.id - b.id;
      }
    );
    replaceChatMessages(nextMessages);
    onForceChatAutoScroll();
  }

  function clampBuildChatUploadProgressPercent(
    value: number | null | undefined
  ) {
    if (!Number.isFinite(Number(value))) {
      return null;
    }
    return Math.max(0, Math.min(100, Math.round(Number(value))));
  }

  function updateLocalBuildChatMessage(
    messageId: number | null,
    options: {
      text?: string;
      uploadProgressPercent?: number | null;
    }
  ) {
    if (!messageId) return;
    const nextText = Object.prototype.hasOwnProperty.call(options, 'text')
      ? String(options.text || '').trim()
      : null;
    const nextProgress = Object.prototype.hasOwnProperty.call(
      options,
      'uploadProgressPercent'
    )
      ? clampBuildChatUploadProgressPercent(options.uploadProgressPercent)
      : null;
    const nextMessages = getLatestChatMessages().map((entry) =>
      entry.id === messageId
        ? {
            ...entry,
            ...(nextText !== null ? { content: nextText } : null),
            ...(Object.prototype.hasOwnProperty.call(
              options,
              'uploadProgressPercent'
            )
              ? { uploadProgressPercent: nextProgress }
              : null)
          }
        : entry
    );
    replaceChatMessages(nextMessages);
  }

  function removeLocalBuildChatMessage(messageId: number | null) {
    if (!messageId) return;
    const nextMessages = getLatestChatMessages().filter(
      (entry) => entry.id !== messageId
    );
    if (nextMessages.length === getLatestChatMessages().length) {
      return;
    }
    replaceChatMessages(nextMessages);
  }

  async function persistBuildChatAssistantNote(
    text: string,
    options?: { buildId?: number | null }
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    const targetBuildId = Number(options?.buildId || build.id || 0);
    const result = await createBuildChatAssistantNote({
      buildId: targetBuildId,
      text: trimmedText
    });
    if (result?.message) {
      appendPersistedBuildChatMessage(result.message, {
        buildId: targetBuildId
      });
      return result.message;
    }
    return null;
  }

  async function uploadBuildChatReferenceFiles(
    files: File[],
    targetBuildId: number,
    options?: {
      onProgress?: (progressPercent: number) => void;
    }
  ) {
    const uploadedReferences: Array<{
      fileName: string;
      url: string;
      mimeType?: string | null;
      filePath: string;
      storedFileName: string;
    }> = [];

    try {
      const totalBytes = files.reduce((sum, file) => {
        const size = Number(file?.size || 0);
        return sum + (Number.isFinite(size) && size > 0 ? size : 0);
      }, 0);
      let completedBytes = 0;
      const fallbackTotalFiles = Math.max(files.length, 1);
      for (const file of files) {
        const filePath = buildBuildChatReferenceUploadPath(targetBuildId);
        const appliedFileName = generateFileName(file.name || 'reference.png');
        let uploadId = '';
        let uploadToken = '';
        await uploadFile({
          filePath,
          fileName: appliedFileName,
          file,
          context: 'embed',
          onUploadCompletedMeta: (meta: UploadCompletionMeta) => {
            uploadId = meta.uploadId;
            uploadToken = meta.uploadToken;
          },
          onUploadProgress: (progressEvent: any) => {
            const loadedBytes = Number(progressEvent?.loaded || 0);
            const effectiveTotalBytes =
              totalBytes > 0 ? totalBytes : fallbackTotalFiles;
            const currentFileProgress =
              totalBytes > 0
                ? Math.max(
                    0,
                    Math.min(Number(file.size || 0), loadedBytes || 0)
                  )
                : Math.max(
                    0,
                    Math.min(1, Number(progressEvent?.progress || 0) || 0)
                  );
            const overallRatio =
              totalBytes > 0
                ? (completedBytes + currentFileProgress) / effectiveTotalBytes
                : Math.min(
                    1,
                    files.findIndex((entry) => entry === file) /
                      fallbackTotalFiles +
                      currentFileProgress / fallbackTotalFiles
                  );
            options?.onProgress?.(24 + overallRatio * 54);
          }
        });
        uploadedReferences.push({
          fileName: file.name || appliedFileName,
          url: `${cloudFrontURL}/attachments/embed/${filePath}/${encodeURIComponent(
            appliedFileName
          )}`,
          mimeType: file.type || null,
          filePath,
          storedFileName: appliedFileName
        });
        await saveFileData({
          fileName: appliedFileName,
          filePath,
          actualFileName: file.name || appliedFileName,
          rootType: 'embed',
          uploadId,
          uploadToken
        });
        completedBytes += Math.max(0, Number(file?.size || 0));
        const completedFileCount = uploadedReferences.length;
        const overallRatio =
          totalBytes > 0
            ? Math.max(0, Math.min(1, completedBytes / totalBytes))
            : Math.max(0, Math.min(1, completedFileCount / fallbackTotalFiles));
        options?.onProgress?.(24 + overallRatio * 54);
      }
    } catch (error) {
      await cleanupBuildChatReferenceUploadsQuietly(
        uploadedReferences.map((reference) => ({
          filePath: reference.filePath,
          storedFileName: reference.storedFileName
        })),
        targetBuildId
      );
      throw error;
    }

    return uploadedReferences;
  }

  async function cleanupBuildChatReferenceUploadsQuietly(
    uploads: Array<{
      filePath: string;
      storedFileName: string;
    }>,
    buildId: number
  ) {
    if (!uploads.length) {
      return;
    }
    try {
      await cleanupBuildChatReferenceUploads({
        buildId,
        uploads
      });
    } catch (error) {
      console.error('Failed to clean up build chat reference uploads:', error);
    }
  }

  function buildBuildChatReferenceUploadPath(targetBuildId: number) {
    return `build-chat-reference/${Number(targetBuildId || 0)}/${Number(
      userId || 0
    )}/${uuidv1()}`;
  }

  async function handleBuildChatFileSelection(
    selectedFiles: File[],
    options?: {
      messageText?: string;
      historyUserNoteText?: string | null;
      localProgressMessageId?: number | null;
      consumeComposerDraft?: boolean;
    }
  ): Promise<BuildChatFileSelectionResult> {
    if (!isOwner || isRunActivityInFlight() || buildChatUploadInFlight) {
      return { handled: false };
    }
    const uploadBuildId = Number(build.id);
    const files = Array.isArray(selectedFiles)
      ? selectedFiles.filter((file) => file instanceof File)
      : [];
    if (files.length === 0) {
      return { handled: false };
    }
    let routingMessageText = buildBuildChatUploadRoutingMessage(
      options?.messageText ?? buildChatDraftMessage
    );
    let historyUserNoteText =
      options &&
      Object.prototype.hasOwnProperty.call(options, 'historyUserNoteText')
        ? options.historyUserNoteText
        : buildChatDraftMessage;
    const localProgressMessageId =
      Number(options?.localProgressMessageId || 0) || null;
    const consumedComposerDraft =
      options?.consumeComposerDraft ||
      !options ||
      !Object.prototype.hasOwnProperty.call(options, 'messageText');
    const consumedDraftText = options?.consumeComposerDraft
      ? (options.messageText ?? buildChatDraftMessage)
      : buildChatDraftMessage;

    function didBuildChatUploadTargetChange() {
      return Number(getLatestBuild()?.id || 0) !== uploadBuildId;
    }

    function clearConsumedBuildChatUploadDraft() {
      if (!consumedComposerDraft) return;
      if (didBuildChatUploadTargetChange()) return;
      setBuildChatDraftMessage((current) =>
        current === consumedDraftText ? '' : current
      );
      setBuildChatDraftApps((current) =>
        current.filter(
          (app) => !buildChatDraftApps.some((entry) => entry.id === app.id)
        )
      );
      setBuildChatDraftFeedback((current) =>
        current.filter((entry) => !buildChatDraftFeedback.includes(entry))
      );
    }

    function clearLocalProgressMessage() {
      removeLocalBuildChatMessage(localProgressMessageId);
      if (
        buildChatUploadProgressMessageIdRef.current === localProgressMessageId
      ) {
        buildChatUploadProgressMessageIdRef.current = null;
      }
    }

    setBuildChatUploadInFlight(true);
    try {
      if (consumedComposerDraft && buildChatDraftFeedback.length) {
        routingMessageText = formatBuildCommentFeedbackMessage(
          routingMessageText,
          buildChatDraftFeedback
        );
        if (historyUserNoteText != null) {
          historyUserNoteText = formatBuildCommentFeedbackMessage(
            historyUserNoteText,
            buildChatDraftFeedback
          );
        }
      }
      if (consumedComposerDraft && buildChatDraftApps.length) {
        const result = await prepareBuildChatAppReferences({
          buildId: uploadBuildId,
          referenceBuildIds: buildChatDraftApps.map((app) => app.id)
        });
        if (didBuildChatUploadTargetChange()) return { handled: true };
        if (
          !Array.isArray(result?.apps) ||
          result.apps.length !== buildChatDraftApps.length
        ) {
          throw new Error(
            'Could not check your app references. Please try again.'
          );
        }
        routingMessageText = formatBuildAppReferenceMessage(
          routingMessageText,
          result.apps
        );
        if (historyUserNoteText != null) {
          historyUserNoteText = formatBuildAppReferenceMessage(
            historyUserNoteText,
            result.apps
          );
        }
      }
      // The server only checks file formats here (no model call, no
      // question). What the member wants done with the files is Lumine's
      // call in its own run, with the whole conversation.
      const decision = (await routeBuildChatUpload({
        buildId: build.id,
        inputRequestId: uuidv1(),
        messageText: routingMessageText,
        files: files.map((file) => ({
          fileName: file.name,
          mimeType: file.type || null,
          sizeBytes: file.size
        })),
        // This client turns videos into still frames for Lumine to look at.
        videoFrameReferences: true
      })) as BuildChatUploadDecision | null;
      if (didBuildChatUploadTargetChange()) {
        return { handled: true };
      }
      const handling: BuildChatUploadHandling | null =
        decision?.handling ||
        (decision?.route === 'reference_document'
          ? 'reference_document'
          : decision?.route === 'chat_reference'
            ? 'attachments'
            : null);
      if (!handling) {
        throw new Error('Failed to check these files.');
      }

      updateLocalBuildChatMessage(localProgressMessageId, {
        text: buildBuildChatUploadRouteProgressMessage(handling, files),
        uploadProgressPercent: buildBuildChatUploadRouteProgressPercent(handling)
      });

      if (handling === 'unsupported') {
        // A format limit, not a question: the draft stays in the composer so
        // the member can send the files again in a way that works.
        clearLocalProgressMessage();
        await persistBuildChatAssistantNote(
          decision?.clarificationQuestion ||
            'I could not use those files. Try sending them again.',
          { buildId: uploadBuildId }
        );
        return { handled: true };
      }

      if (handling === 'reference_document') {
        const documentFiles = files.filter(isReferenceDocumentChatFile);
        if (documentFiles.length === 0) {
          clearLocalProgressMessage();
          await persistBuildChatAssistantNote(
            'I can read PDF, Word (.docx), .zip archives, text, Markdown, CSV, JSON, HTML and code files as reference documents. Attach one of those and I will read it.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const references = await uploadBuildChatReferenceFiles(
          documentFiles,
          uploadBuildId,
          {
            onProgress: (progressPercent) => {
              updateLocalBuildChatMessage(localProgressMessageId, {
                uploadProgressPercent: progressPercent
              });
            }
          }
        );
        const cleanupUploads = references.map((reference) => ({
          filePath: reference.filePath,
          storedFileName: reference.storedFileName
        }));
        if (didBuildChatUploadTargetChange()) {
          await cleanupBuildChatReferenceUploadsQuietly(
            cleanupUploads,
            uploadBuildId
          );
          return { handled: true };
        }
        updateLocalBuildChatMessage(localProgressMessageId, {
          text:
            documentFiles.length === 1
              ? 'Reading the text in your document...'
              : 'Reading the text in your documents...',
          uploadProgressPercent: 80
        });
        let result: any;
        try {
          result = await createBuildChatReferenceDocuments({
            buildId: uploadBuildId,
            messageText: routingMessageText || historyUserNoteText,
            inputRequestId: decision?.inputRequestId,
            uploads: references.map((reference, index) => ({
              url: reference.url,
              fileName: reference.fileName,
              mimeType: getReferenceDocumentUploadMimeType(
                documentFiles[index]
              ),
              sizeBytes: Number(documentFiles[index]?.size || 0) || null
            }))
          });
          if (!result || !Array.isArray(result.documents)) {
            throw new Error(
              String(result?.error || 'I could not read those documents.')
            );
          }
        } catch (error) {
          await cleanupBuildChatReferenceUploadsQuietly(
            cleanupUploads,
            uploadBuildId
          );
          throw error;
        }
        if (result.userMessage) {
          appendPersistedBuildChatMessage(result.userMessage, {
            buildId: uploadBuildId
          });
        }
        if (result.assistantMessage) {
          appendPersistedBuildChatMessage(result.assistantMessage, {
            buildId: uploadBuildId
          });
        }
        updateLocalBuildChatMessage(localProgressMessageId, {
          uploadProgressPercent: 94
        });
        clearLocalProgressMessage();
        const readyCount = Number(result.readyCount || 0);
        if (routingMessageText.trim() && readyCount > 0) {
          setBuildChatUploadInFlight(false);
          const started = await sendBuildMessageText(routingMessageText, {
            existingUserMessageId: Number(result.userMessage?.id || 0) || null,
            ignoreUploadInFlight: true
          });
          if (started) {
            clearConsumedBuildChatUploadDraft();
            return { handled: true };
          }
          await persistBuildChatAssistantNote(
            'I saved your documents, but the run did not start. Retry your message when ready.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      // Attachments: pictures and sounds go to Lumine with the message.
      // Videos travel as still frames Lumine can look at.
      const imageFiles = files.filter(isImageChatReferenceFile);
      const audioFiles = files.filter(isAudioChatAttachmentFile);
      const videoFiles = files.filter(isVideoChatReferenceFile);
      const framesPerVideo = getVideoFrameCountPerFile({
        imageCount: imageFiles.length + audioFiles.length,
        videoCount: videoFiles.length
      });
      const frameFiles: File[] = [];
      if (videoFiles.length > 0) {
        // The typed draft stays in the composer on both notes below, so
        // the user's bug description is never lost.
        if (framesPerVideo === 0) {
          clearLocalProgressMessage();
          await persistBuildChatAssistantNote(
            'I can take up to 8 files at once, and each video needs at least one picture from it. Send the video with fewer files.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        try {
          for (const videoFile of videoFiles) {
            frameFiles.push(
              ...(await extractVideoReferenceFrames(videoFile, framesPerVideo))
            );
          }
        } catch {
          clearLocalProgressMessage();
          await persistBuildChatAssistantNote(
            "I couldn't read frames from that video. Send a few screenshots of what happens, or describe it and I'll take a look.",
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        if (didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
      }
      const attachmentFiles = [...imageFiles, ...audioFiles, ...frameFiles];
      if (attachmentFiles.length > 8) {
        throw new Error('Send up to 8 files together. Your draft is kept.');
      }
      if (attachmentFiles.length === 0) {
        throw new Error('I could not use those files. Your draft is kept.');
      }
      const attachments = await uploadBuildChatReferenceFiles(
        attachmentFiles,
        uploadBuildId,
        {
          onProgress: (progressPercent) => {
            updateLocalBuildChatMessage(localProgressMessageId, {
              uploadProgressPercent: progressPercent
            });
          }
        }
      );
      const cleanupUploads = attachments.map((attachment) => ({
        filePath: attachment.filePath,
        storedFileName: attachment.storedFileName
      }));
      if (didBuildChatUploadTargetChange()) {
        await cleanupBuildChatReferenceUploadsQuietly(
          cleanupUploads,
          uploadBuildId
        );
        return { handled: true };
      }
      let runMessageContext = buildBuildChatHiddenMessageContext({
        messageText: routingMessageText,
        references: attachments.map((attachment) => ({
          fileName: attachment.fileName,
          url: attachment.url
        }))
      });
      let runMessageText = routingMessageText.trim();
      let existingUserMessageId = null as number | null;
      try {
        const result = await createBuildChatReferenceNote({
          buildId: uploadBuildId,
          messageText: routingMessageText,
          inputRequestId: decision?.inputRequestId,
          references: attachments.map((attachment) => ({
            fileName: attachment.fileName,
            url: attachment.url,
            mimeType: attachment.mimeType || null
          })),
          hidden: true
        });
        const resolvedMessageContext = String(
          result?.messageContext || ''
        ).trim();
        if (resolvedMessageContext) {
          runMessageContext = resolvedMessageContext;
        }
        if (result?.userMessage) {
          appendPersistedBuildChatMessage(result.userMessage, {
            buildId: uploadBuildId
          });
          existingUserMessageId = Number(result.userMessage?.id || 0) || null;
          // Files sent without words still go to Lumine, under the note the
          // server saved for them.
          if (!runMessageText) {
            runMessageText = String(result.userMessage?.content || '').trim();
          }
        }
      } catch (error) {
        await cleanupBuildChatReferenceUploadsQuietly(
          cleanupUploads,
          uploadBuildId
        );
        throw error;
      }
      updateLocalBuildChatMessage(localProgressMessageId, {
        uploadProgressPercent: 92
      });
      clearLocalProgressMessage();
      setBuildChatUploadInFlight(false);
      const started = runMessageText
        ? await sendBuildMessageText(runMessageText, {
            messageContext: runMessageContext,
            existingUserMessageId,
            ignoreUploadInFlight: true
          })
        : false;
      if (started) {
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }
      await persistBuildChatAssistantNote(
        'I saved your files, but the run did not start. Retry your message when ready.',
        { buildId: uploadBuildId }
      );
      return { handled: true };
    } catch (error: any) {
      if (didBuildChatUploadTargetChange()) return { handled: true };
      console.error('Failed to process build chat upload:', error);
      clearLocalProgressMessage();
      await persistBuildChatAssistantNote(
        error?.message || 'I could not process those uploaded files.',
        { buildId: uploadBuildId }
      );
      return { handled: true };
    } finally {
      clearLocalProgressMessage();
      if (!didBuildChatUploadTargetChange()) setBuildChatUploadInFlight(false);
    }
  }

  function startBuildChatUploadProcessing(
    selectedFiles: File[],
    options?: {
      messageText?: string;
      historyUserNoteText?: string | null;
      consumeComposerDraft?: boolean;
    }
  ) {
    if (!isOwner || isRunActivityInFlight() || buildChatUploadInFlight) {
      return false;
    }
    const files = Array.isArray(selectedFiles)
      ? selectedFiles.filter((file) => file instanceof File)
      : [];
    if (files.length === 0) {
      return false;
    }
    if (options?.consumeComposerDraft && options.messageText != null) {
      setBuildChatDraftMessage(options.messageText);
    }
    const progressMessageId = appendLocalBuildChatAssistantMessage(
      buildBuildChatUploadPendingMessage(files)
    );
    buildChatUploadProgressMessageIdRef.current = progressMessageId;
    void handleBuildChatFileSelection(files, {
      ...options,
      localProgressMessageId: progressMessageId
    });
    return true;
  }

  function handleOpenBuildChatUpload() {
    if (!isOwner || isRunActivityInFlight() || buildChatUploadInFlight) return;
    setBuildChatUploadModalShown(true);
  }

  return {
    buildChatDraftMessage,
    buildChatDraftApps,
    setBuildChatDraftApps,
    buildChatDraftFeedback,
    setBuildChatDraftFeedback,
    buildChatUploadFileObj,
    buildChatUploadInFlight,
    buildChatUploadModalShown,
    handleOpenBuildChatUpload,
    setBuildChatDraftMessage,
    setBuildChatUploadFileObj,
    setBuildChatUploadModalShown,
    startBuildChatUploadProcessing
  };
}
