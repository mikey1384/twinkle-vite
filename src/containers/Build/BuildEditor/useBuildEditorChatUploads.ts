import {
  useEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import { cloudFrontURL } from '~/constants/defaultValues';
import { generateFileName } from '~/helpers/stringHelpers';
import { v1 as uuidv1 } from 'uuid';
import type { PreviewPanelHandle } from '../PreviewPanel/types';
import {
  BUILD_CHAT_HIDDEN_REFERENCE_CONTEXT_PREFIX,
  buildBuildChatHiddenMessageContext,
  buildBuildChatUploadPendingMessage,
  buildBuildChatUploadRouteProgressMessage,
  buildBuildChatUploadRouteProgressPercent,
  buildBuildChatUploadRoutingMessage,
  buildImportedProjectFilesNote,
  buildUploadedRuntimeAssetsNote,
  isImageChatReferenceFile
} from './domain/chatUploads';
import type {
  Build,
  BuildChatFileSelectionResult,
  BuildChatUploadDecision,
  BuildChatUploadRoute,
  BuildPlanAction,
  BuildPromptBinding,
  ChatMessage,
  PendingBuildChatUploadClarification
} from './types';

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
  cleanupBuildChatReferenceUploads: (options: Record<string, any>) => Promise<any>;
  createBuildChatAssistantNote: (options: Record<string, any>) => Promise<any>;
  createBuildChatReferenceNote: (options: Record<string, any>) => Promise<any>;
  createBuildChatUserNote: (options: Record<string, any>) => Promise<any>;
  getLatestBuild: () => Build;
  getLatestChatMessages: () => ChatMessage[];
  isOwner: boolean;
  isRunActivityInFlight: () => boolean;
  onForceChatAutoScroll: () => void;
  previewPanelRef: RefObject<PreviewPanelHandle | null>;
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

export default function useBuildEditorChatUploads({
  appendLocalBuildChatAssistantMessage,
  build,
  cleanupBuildChatReferenceUploads,
  createBuildChatAssistantNote,
  createBuildChatReferenceNote,
  createBuildChatUserNote,
  getLatestBuild,
  getLatestChatMessages,
  isOwner,
  isRunActivityInFlight,
  onForceChatAutoScroll,
  previewPanelRef,
  replaceChatMessages,
  routeBuildChatUpload,
  saveFileData,
  sendBuildMessageText,
  uploadFile,
  userId
}: UseBuildEditorChatUploadsOptions) {
  const [buildChatDraftMessage, setBuildChatDraftMessage] = useState('');
  const [buildChatUploadModalShown, setBuildChatUploadModalShown] =
    useState(false);
  const [buildChatUploadFileObj, setBuildChatUploadFileObj] = useState<
    File | File[] | null
  >(null);
  const [buildChatUploadInFlight, setBuildChatUploadInFlight] = useState(false);
  const pendingBuildChatUploadClarificationRef = useRef<
    PendingBuildChatUploadClarification[]
  >([]);
  const buildChatUploadProgressMessageIdRef = useRef<number | null>(null);

  useEffect(() => {
    setBuildChatDraftMessage('');
    setBuildChatUploadModalShown(false);
    setBuildChatUploadFileObj(null);
    setBuildChatUploadInFlight(false);
    pendingBuildChatUploadClarificationRef.current = [];
    buildChatUploadProgressMessageIdRef.current = null;
  }, [build.id]);

  async function handlePendingBuildChatUploadMessage(trimmedMessage: string) {
    const pendingBuildChatUploadClarification =
      pendingBuildChatUploadClarificationRef.current[
        pendingBuildChatUploadClarificationRef.current.length - 1
      ] || null;
    if (!pendingBuildChatUploadClarification) {
      return null;
    }
    await persistBuildChatUserNote(trimmedMessage);
    const result = await handleBuildChatFileSelection(
      pendingBuildChatUploadClarification.files,
      {
        messageText: buildBuildChatUploadRoutingMessage(
          pendingBuildChatUploadClarification.messageText,
          trimmedMessage
        ),
        historyUserNoteText:
          pendingBuildChatUploadClarification.intentPersisted
            ? null
            : pendingBuildChatUploadClarification.messageText,
        resolvingPendingClarification: true
      }
    );
    return result.handled;
  }

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

  async function maybeContinueBuildChatRequestAfterMutationUpload({
    routingMessageText,
    existingUserMessageId
  }: {
    routingMessageText: string;
    existingUserMessageId?: number | null;
  }) {
    const trimmedMessage = String(routingMessageText || '').trim();
    if (!trimmedMessage) {
      return false;
    }
    setBuildChatUploadInFlight(false);
    return await sendBuildMessageText(trimmedMessage, {
      existingUserMessageId: Number(existingUserMessageId || 0) || null,
      ignoreUploadInFlight: true
    });
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

  async function persistBuildChatUserNote(
    text: string,
    options?: { buildId?: number | null }
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    const targetBuildId = Number(options?.buildId || build.id || 0);
    const result = await createBuildChatUserNote({
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

  async function persistBuildChatUploadIntentNote(
    text?: string | null,
    options?: { buildId?: number | null }
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    return await persistBuildChatUserNote(trimmedText, options);
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
        await uploadFile({
          filePath,
          fileName: appliedFileName,
          file,
          context: 'embed',
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
          rootType: 'embed'
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
      resolvingPendingClarification?: boolean;
      localProgressMessageId?: number | null;
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
    const routingMessageText = buildBuildChatUploadRoutingMessage(
      options?.messageText ?? buildChatDraftMessage
    );
    const historyUserNoteText =
      options &&
      Object.prototype.hasOwnProperty.call(options, 'historyUserNoteText')
        ? options.historyUserNoteText
        : buildChatDraftMessage;
    const resolvingPendingClarification = Boolean(
      options?.resolvingPendingClarification
    );
    const localProgressMessageId =
      Number(options?.localProgressMessageId || 0) || null;
    const currentPendingBuildChatUploadClarification =
      resolvingPendingClarification
        ? pendingBuildChatUploadClarificationRef.current[
            pendingBuildChatUploadClarificationRef.current.length - 1
          ] || null
        : null;
    const pendingClarificationIntentAlreadyPersisted = Boolean(
      currentPendingBuildChatUploadClarification?.intentPersisted
    );
    const consumedComposerDraft =
      !options || !Object.prototype.hasOwnProperty.call(options, 'messageText');

    function didBuildChatUploadTargetChange() {
      return Number(getLatestBuild()?.id || 0) !== uploadBuildId;
    }

    function clearConsumedBuildChatUploadDraft() {
      if (!consumedComposerDraft) return;
      setBuildChatDraftMessage('');
    }

    function clearLocalProgressMessage() {
      removeLocalBuildChatMessage(localProgressMessageId);
      if (
        buildChatUploadProgressMessageIdRef.current === localProgressMessageId
      ) {
        buildChatUploadProgressMessageIdRef.current = null;
      }
    }

    function pushPendingBuildChatUploadClarification(
      pendingClarification: PendingBuildChatUploadClarification
    ) {
      pendingBuildChatUploadClarificationRef.current = [pendingClarification];
    }

    function replaceCurrentPendingBuildChatUploadClarification(
      pendingClarification: PendingBuildChatUploadClarification
    ) {
      const pendingClarifications =
        pendingBuildChatUploadClarificationRef.current;
      if (pendingClarifications.length === 0) {
        pendingBuildChatUploadClarificationRef.current = [pendingClarification];
        return;
      }
      pendingBuildChatUploadClarificationRef.current = [
        ...pendingClarifications.slice(0, -1),
        pendingClarification
      ];
    }

    function clearCurrentPendingBuildChatUploadClarification() {
      if (!resolvingPendingClarification) return;
      const pendingClarifications =
        pendingBuildChatUploadClarificationRef.current;
      if (pendingClarifications.length === 0) return;
      pendingBuildChatUploadClarificationRef.current =
        pendingClarifications.slice(0, -1);
    }

    async function persistClarificationIntentIfNeeded() {
      if (pendingClarificationIntentAlreadyPersisted) {
        return true;
      }
      const trimmedHistoryUserNoteText = String(
        historyUserNoteText || ''
      ).trim();
      if (!trimmedHistoryUserNoteText) {
        return false;
      }
      await persistBuildChatUploadIntentNote(trimmedHistoryUserNoteText, {
        buildId: uploadBuildId
      });
      return true;
    }

    setBuildChatUploadInFlight(true);
    try {
      const decision = (await routeBuildChatUpload({
        buildId: build.id,
        messageText: routingMessageText,
        files: files.map((file) => ({
          fileName: file.name,
          mimeType: file.type || null,
          sizeBytes: file.size
        }))
      })) as BuildChatUploadDecision | null;
      if (didBuildChatUploadTargetChange()) {
        return { handled: true };
      }

      const route = String(
        decision?.route || ''
      ).trim() as BuildChatUploadRoute;
      if (!route) {
        throw new Error('Failed to determine what to do with these files.');
      }

      updateLocalBuildChatMessage(localProgressMessageId, {
        text: buildBuildChatUploadRouteProgressMessage(route, files),
        uploadProgressPercent: buildBuildChatUploadRouteProgressPercent(route)
      });

      if (route === 'clarify') {
        clearLocalProgressMessage();
        const intentPersisted = await persistClarificationIntentIfNeeded();
        const pendingClarification = {
          files: [...files],
          messageText: routingMessageText,
          intentPersisted
        };
        if (resolvingPendingClarification) {
          replaceCurrentPendingBuildChatUploadClarification(
            pendingClarification
          );
        } else {
          pushPendingBuildChatUploadClarification(pendingClarification);
        }
        await persistBuildChatAssistantNote(
          decision?.clarificationQuestion ||
            'Tell me whether you want these uploaded into the project, used as build assets, or kept as reference in chat.',
          { buildId: uploadBuildId }
        );
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      clearCurrentPendingBuildChatUploadClarification();

      if (route === 'project_files_import') {
        const previewPanel = previewPanelRef.current;
        if (!previewPanel || didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        const result =
          await previewPanel.importProjectFilesFromChatUpload(files);
        if (didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        updateLocalBuildChatMessage(localProgressMessageId, {
          uploadProgressPercent: 86
        });
        clearLocalProgressMessage();
        if (!result?.success) {
          await persistBuildChatAssistantNote(
            result?.error || 'I could not import those project files.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const persistedUserNote = await persistBuildChatUploadIntentNote(
          historyUserNoteText,
          {
            buildId: uploadBuildId
          }
        );
        const continued =
          await maybeContinueBuildChatRequestAfterMutationUpload({
            routingMessageText,
            existingUserMessageId: persistedUserNote?.id || null
          });
        if (continued) {
          clearConsumedBuildChatUploadDraft();
          return { handled: true };
        }
        await persistBuildChatAssistantNote(
          buildImportedProjectFilesNote(result),
          { buildId: uploadBuildId }
        );
        if (String(routingMessageText || '').trim()) {
          await persistBuildChatAssistantNote(
            'I imported the files, but the run did not start. Retry your message when ready.',
            { buildId: uploadBuildId }
          );
        }
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      if (route === 'runtime_asset_upload') {
        const previewPanel = previewPanelRef.current;
        if (!previewPanel || didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        const result =
          await previewPanel.uploadProjectAssetsFromChatUpload(files);
        if (didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        updateLocalBuildChatMessage(localProgressMessageId, {
          uploadProgressPercent: 86
        });
        clearLocalProgressMessage();
        if (!result?.success) {
          await persistBuildChatAssistantNote(
            result?.error || 'I could not upload those build assets.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const persistedUserNote = await persistBuildChatUploadIntentNote(
          historyUserNoteText,
          {
            buildId: uploadBuildId
          }
        );
        const continued =
          await maybeContinueBuildChatRequestAfterMutationUpload({
            routingMessageText,
            existingUserMessageId: persistedUserNote?.id || null
          });
        if (continued) {
          clearConsumedBuildChatUploadDraft();
          return { handled: true };
        }
        await persistBuildChatAssistantNote(
          buildUploadedRuntimeAssetsNote(result),
          { buildId: uploadBuildId }
        );
        if (String(routingMessageText || '').trim()) {
          await persistBuildChatAssistantNote(
            'I uploaded the asset, but the run did not start. Retry your message when ready.',
            { buildId: uploadBuildId }
          );
        }
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      if (route === 'chat_reference') {
        const referenceFiles = files.filter(isImageChatReferenceFile);
        if (referenceFiles.length === 0) {
          clearLocalProgressMessage();
          await persistBuildChatAssistantNote(
            'I can only use image uploads as chat reference right now.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const references = await uploadBuildChatReferenceFiles(
          referenceFiles,
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
        const hiddenMessageContext = buildBuildChatHiddenMessageContext({
          messageText: routingMessageText,
          references: references.map((reference) => ({
            fileName: reference.fileName,
            url: reference.url
          }))
        });
        if (!resolvingPendingClarification && routingMessageText.trim()) {
          let hiddenReferenceContext = hiddenMessageContext;
          let existingUserMessageId = null as number | null;
          try {
            const result = await createBuildChatReferenceNote({
              buildId: uploadBuildId,
              messageText: routingMessageText,
              references: references.map((reference) => ({
                fileName: reference.fileName,
                url: reference.url,
                mimeType: reference.mimeType || null
              })),
              hidden: true
            });
            const resolvedMessageContext = String(
              result?.messageContext || ''
            ).trim();
            if (resolvedMessageContext) {
              hiddenReferenceContext = resolvedMessageContext;
            }
            if (result?.userMessage) {
              appendPersistedBuildChatMessage(result.userMessage, {
                buildId: uploadBuildId
              });
              existingUserMessageId =
                Number(result.userMessage?.id || 0) || null;
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
          const started = await sendBuildMessageText(routingMessageText, {
            messageContext: hiddenReferenceContext,
            existingUserMessageId,
            ignoreUploadInFlight: true
          });
          if (started) {
            clearConsumedBuildChatUploadDraft();
            return { handled: true };
          }
          await persistBuildChatAssistantNote(
            'I saved the image reference, but the run did not start. Retry your message when ready.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        let result;
        try {
          result = await createBuildChatReferenceNote({
            buildId: uploadBuildId,
            messageText: routingMessageText,
            references: references.map((reference) => ({
              fileName: reference.fileName,
              url: reference.url,
              mimeType: reference.mimeType || null
            }))
          });
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
        if (result?.userMessage) {
          appendPersistedBuildChatMessage(result.userMessage, {
            buildId: uploadBuildId
          });
        }
        if (result?.assistantMessage) {
          appendPersistedBuildChatMessage(result.assistantMessage, {
            buildId: uploadBuildId
          });
        }
        if (result?.userMessage || result?.assistantMessage) {
          clearConsumedBuildChatUploadDraft();
          return { handled: true };
        }
        await persistBuildChatAssistantNote(
          `Using ${referenceFiles.length} reference image${
            referenceFiles.length === 1 ? '' : 's'
          } for your request.`,
          { buildId: uploadBuildId }
        );
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      const fallbackIntentPersisted =
        await persistClarificationIntentIfNeeded();
      const pendingClarification = {
        files: [...files],
        messageText: routingMessageText,
        intentPersisted: fallbackIntentPersisted
      };
      clearLocalProgressMessage();
      if (resolvingPendingClarification) {
        replaceCurrentPendingBuildChatUploadClarification(pendingClarification);
      } else {
        pushPendingBuildChatUploadClarification(pendingClarification);
      }
      await persistBuildChatAssistantNote(
        'I was not confident enough to route those files automatically. Tell me whether they should be imported, uploaded as assets, or used as reference.',
        { buildId: uploadBuildId }
      );
      clearConsumedBuildChatUploadDraft();
      return { handled: true };
    } catch (error: any) {
      console.error('Failed to process build chat upload:', error);
      clearLocalProgressMessage();
      await persistBuildChatAssistantNote(
        error?.message || 'I could not process those uploaded files.',
        { buildId: uploadBuildId }
      );
      return { handled: true };
    } finally {
      clearLocalProgressMessage();
      setBuildChatUploadInFlight(false);
    }
  }

  function startBuildChatUploadProcessing(
    selectedFiles: File[],
    options?: {
      messageText?: string;
      historyUserNoteText?: string | null;
      resolvingPendingClarification?: boolean;
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
    buildChatUploadFileObj,
    buildChatUploadInFlight,
    buildChatUploadModalShown,
    handlePendingBuildChatUploadMessage,
    handleOpenBuildChatUpload,
    setBuildChatDraftMessage,
    setBuildChatUploadFileObj,
    setBuildChatUploadModalShown,
    startBuildChatUploadProcessing
  };
}
