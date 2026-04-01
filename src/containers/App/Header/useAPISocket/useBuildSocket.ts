import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { socket } from '~/constants/sockets/api';
import { useBuildContext, useKeyContext } from '~/contexts';

export default function useBuildSocket() {
  const { pathname } = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const onUpdateBuildRunStatus = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStatus
  );
  const onUpdateBuildRunStream = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStream
  );
  const onAppendBuildRunEvent = useBuildContext(
    (v) => v.actions.onAppendBuildRunEvent
  );
  const onUpdateBuildRunUsage = useBuildContext(
    (v) => v.actions.onUpdateBuildRunUsage
  );
  const onCompleteBuildRun = useBuildContext(
    (v) => v.actions.onCompleteBuildRun
  );
  const onFailBuildRun = useBuildContext((v) => v.actions.onFailBuildRun);
  const onStopBuildRun = useBuildContext((v) => v.actions.onStopBuildRun);
  const onResetBuildRuns = useBuildContext((v) => v.actions.onResetBuildRuns);
  const usingBuildWorkspace = /^\/build\/\d+\/?$/.test(pathname);

  useEffect(() => {
    onResetBuildRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (usingBuildWorkspace) {
      return;
    }

    function handleGenerateStatus({
      requestId,
      status
    }: {
      requestId?: string;
      status?: string;
    }) {
      if (!requestId) return;
      onUpdateBuildRunStatus({
        requestId,
        status: status || null
      });
    }

    function handleGenerateUpdate({
      requestId,
      reply,
      codeGenerated,
      projectFiles
    }: {
      requestId?: string;
      reply?: string;
      codeGenerated?: string | null;
      projectFiles?: Array<{ path: string; content?: string }> | null;
    }) {
      if (!requestId) return;
      const buildRun: any = { requestId };
      if (typeof reply === 'string') {
        buildRun.reply = reply;
      }
      if (Object.prototype.hasOwnProperty.call(arguments[0] || {}, 'codeGenerated')) {
        buildRun.codeGenerated = codeGenerated ?? null;
      }
      if (Array.isArray(projectFiles) && projectFiles.length > 0) {
        buildRun.projectFiles = projectFiles;
      }
      onUpdateBuildRunStream(buildRun);
    }

    function handleGenerateComplete({
      requestId,
      assistantText,
      artifact,
      code,
      projectFiles,
      executionPlan,
      runtimeExplorationPlan,
      runtimePlanRefined,
      message
    }: {
      requestId?: string;
      assistantText?: string;
      artifact?: {
        content?: string;
        versionId?: number | null;
      };
      code?: string | null;
      projectFiles?: Array<{ path: string; content?: string }> | null;
      executionPlan?: any | null;
      runtimeExplorationPlan?: any | null;
      runtimePlanRefined?: boolean;
      message?: {
        id?: number | null;
        userMessageId?: number | null;
        artifactVersionId?: number | null;
        createdAt?: number;
      };
    }) {
      if (!requestId) return;
      onCompleteBuildRun({
        requestId,
        assistantText,
        artifactCode: artifact?.content ?? code ?? null,
        projectFiles:
          Array.isArray(projectFiles) && projectFiles.length > 0
            ? projectFiles
            : null,
        executionPlan,
        runtimeExplorationPlan,
        runtimePlanRefined: Boolean(runtimePlanRefined),
        artifactVersionId:
          Number(message?.artifactVersionId || 0) > 0
            ? Number(message?.artifactVersionId)
            : Number(artifact?.versionId || 0) > 0
              ? Number(artifact?.versionId)
              : null,
        persistedAssistantId:
          Number(message?.id || 0) > 0 ? Number(message?.id) : null,
        persistedUserId:
          Number(message?.userMessageId || 0) > 0
            ? Number(message?.userMessageId)
            : null,
        createdAt: Number(message?.createdAt || 0) > 0 ? message?.createdAt : undefined
      });
    }

    function handleGenerateError({
      requestId,
      error
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId) return;
      onFailBuildRun({
        requestId,
        error: error || 'Failed to generate code.'
      });
    }

    function handleGenerateStopped({
      requestId
    }: {
      requestId?: string;
    }) {
      if (!requestId) return;
      onStopBuildRun({
        requestId
      });
    }

    function handleUsageUpdate({
      requestId,
      usage
    }: {
      requestId?: string;
      usage?: {
        stage?: string;
        model?: string;
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      };
    }) {
      if (!requestId || !usage) return;
      onUpdateBuildRunUsage({
        requestId,
        usage
      });
    }

    function handleRunEvent({
      requestId,
      event
    }: {
      requestId?: string;
      event?: {
        buildId?: number | null;
        kind?: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
        phase?: string | null;
        message?: string;
        createdAt?: number;
        deduped?: boolean;
        usage?: {
          stage?: string | null;
          model?: string | null;
          inputTokens?: number;
          outputTokens?: number;
          totalTokens?: number;
        } | null;
      };
    }) {
      if (!requestId || !event?.kind || !event?.message) return;
      onAppendBuildRunEvent({
        requestId,
        buildId: Number(event.buildId || 0) || undefined,
        event: {
          id: `${event.createdAt || Date.now()}-${event.kind}-${requestId}`,
          kind: event.kind,
          phase: event.phase || null,
          message: event.message,
          createdAt:
            typeof event.createdAt === 'number' && Number.isFinite(event.createdAt)
              ? event.createdAt
              : Date.now(),
          deduped: Boolean(event.deduped),
          usage: event.usage || null
        }
      });
    }

    socket.on('build_generate_status', handleGenerateStatus);
    socket.on('build_generate_update', handleGenerateUpdate);
    socket.on('build_generate_complete', handleGenerateComplete);
    socket.on('build_generate_error', handleGenerateError);
    socket.on('build_generate_stopped', handleGenerateStopped);
    socket.on('build_usage_update', handleUsageUpdate);
    socket.on('build_run_event', handleRunEvent);

    return () => {
      socket.off('build_generate_status', handleGenerateStatus);
      socket.off('build_generate_update', handleGenerateUpdate);
      socket.off('build_generate_complete', handleGenerateComplete);
      socket.off('build_generate_error', handleGenerateError);
      socket.off('build_generate_stopped', handleGenerateStopped);
      socket.off('build_usage_update', handleUsageUpdate);
      socket.off('build_run_event', handleRunEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingBuildWorkspace]);
}
