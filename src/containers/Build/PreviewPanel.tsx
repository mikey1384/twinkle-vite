import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

interface Build {
  id: number;
  title: string;
  username: string;
  primaryArtifactId?: number | null;
}

interface PreviewPanelProps {
  build: Build;
  code: string | null;
  isOwner: boolean;
  onCodeChange: (code: string) => void;
  onReplaceCode: (code: string) => void;
  onSaveVersion: (summary?: string) => void;
  savingVersion: boolean;
}

interface ArtifactVersion {
  id: number;
  version: number;
  summary: string | null;
  gitCommitSha: string | null;
  createdAt: number;
  createdByRole: 'user' | 'assistant';
}

// The Twinkle SDK script that gets injected into builds
const TWINKLE_SDK_SCRIPT = `
<script>
(function() {
  'use strict';
  if (window.Twinkle) return;

  let SQL = null;
  let db = null;
  let isInitialized = false;
  let pendingRequests = new Map();
  let requestId = 0;

  function getRequestId() {
    return 'twinkle_' + (++requestId) + '_' + Date.now();
  }

  function sendRequest(type, payload) {
    return new Promise((resolve, reject) => {
      const id = getRequestId();
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }, 30000);

      pendingRequests.set(id, { resolve, reject, timeout });

      window.parent.postMessage({
        source: 'twinkle-build',
        id: id,
        type: type,
        payload: payload
      }, '*');
    });
  }

  window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || data.source !== 'twinkle-parent') return;

    const pending = pendingRequests.get(data.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingRequests.delete(data.id);

    if (data.error) {
      pending.reject(new Error(data.error));
    } else {
      pending.resolve(data.payload);
    }
  });

  async function loadSqlJs() {
    if (SQL) return SQL;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js';
      script.onload = async () => {
        try {
          SQL = await window.initSqlJs({
            locateFile: file => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + file
          });
          resolve(SQL);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = () => reject(new Error('Failed to load sql.js'));
      document.head.appendChild(script);
    });
  }

  window.Twinkle = {
    db: {
      async open() {
        if (db) return db;
        await loadSqlJs();
        try {
          const response = await sendRequest('db:load', {});
          if (response && response.data) {
            const binary = atob(response.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            db = new SQL.Database(bytes);
          } else {
            db = new SQL.Database();
          }
          isInitialized = true;
          return db;
        } catch (err) {
          console.warn('Failed to load database, creating new one:', err);
          db = new SQL.Database();
          isInitialized = true;
          return db;
        }
      },

      async save() {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const data = db.export();
        let binary = '';
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        const base64 = btoa(binary);
        return await sendRequest('db:save', { data: base64 });
      },

      exec(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        return db.exec(sql, params);
      },

      run(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        db.run(sql, params);
      },

      query(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const stmt = db.prepare(sql);
        if (params) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },

      getDb() { return db; },
      isOpen() { return isInitialized && db !== null; },
      close() {
        if (db) { db.close(); db = null; isInitialized = false; }
      }
    },

    ai: {
      _prompts: null,

      async listPrompts() {
        if (this._prompts) return this._prompts;
        const response = await sendRequest('ai:list-prompts', {});
        this._prompts = response.prompts || [];
        return this._prompts;
      },

      async chat({ promptId, message, history }) {
        if (!promptId) throw new Error('promptId is required');
        if (!message) throw new Error('message is required');

        const response = await sendRequest('ai:chat', {
          promptId: promptId,
          message: message,
          history: history || []
        });

        return {
          text: response.response,
          prompt: response.prompt
        };
      }
    },

    build: { id: null, title: null, username: null },
    _init(info) {
      this.build.id = info.id;
      this.build.title = info.title;
      this.build.username = info.username;
    }
  };

  sendRequest('init', {}).then(info => {
    if (info) window.Twinkle._init(info);
  }).catch(() => {});

  console.log('Twinkle SDK loaded');
})();
</script>
`;

const panelClass = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  gap: 0.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    height: 50%;
  }
`;

const toolbarClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: #fff;
`;

const toolbarTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  color: var(--chat-text);
  font-size: 1.05rem;
`;

const toggleGroupClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
`;

const toggleButtonClass = css`
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--chat-text);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  &:hover {
    background: var(--chat-bg);
    color: var(--chat-text);
  }
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const actionButtonClass = css`
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 10px;
  background: var(--theme-bg);
  color: var(--theme-text);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transition: transform 0.2s ease, background 0.2s ease;
  &:hover:not(:disabled) {
    background: var(--theme-hover-bg);
    transform: translateY(-1px);
  }
  &:disabled {
    background: var(--theme-disabled-bg);
    cursor: not-allowed;
  }
`;

const ghostActionButtonClass = css`
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transition: border 0.2s ease, color 0.2s ease, transform 0.2s ease;
  &:hover {
    border-color: var(--theme-border);
    color: var(--chat-text);
    transform: translateY(-1px);
  }
`;

const versionRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--ui-border);
`;

const versionMetaClass = css`
  font-size: 0.8rem;
  color: var(--chat-text);
  opacity: 0.6;
  margin-top: 0.2rem;
`;

const historyModalShellClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const historyModalHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
`;

const historyModalTitleClass = css`
  font-weight: 700;
  color: var(--chat-text);
  font-size: 1.1rem;
`;

const historyModalCloseButtonClass = css`
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  &:hover {
    background: var(--chat-bg);
    border-color: var(--theme-border);
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
  }
`;

const historyModalContentClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
`;

export default function PreviewPanel({
  build,
  code,
  isOwner,
  onCodeChange,
  onReplaceCode,
  onSaveVersion,
  savingVersion
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(null);
  const [artifactId, setArtifactId] = useState<number | null>(
    build.primaryArtifactId ?? null
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const buildRef = useRef(build);
  const isOwnerRef = useRef(isOwner);
  const userIdRef = useRef<number | null>(null);
  const missionProgressRef = useRef({
    promptListUsed: false,
    aiChatUsed: false,
    dbUsed: false
  });

  const userId = useKeyContext((v) => v.myState.userId);
  const missions = useKeyContext((v) => v.myState.missions);
  const buildMissionState = missions?.build || {};
  const promptListUsed = Boolean(buildMissionState.promptListUsed);
  const aiChatUsed = Boolean(buildMissionState.aiChatUsed);
  const dbUsed = Boolean(buildMissionState.dbUsed);

  const downloadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.downloadBuildDatabase
  );
  const uploadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.uploadBuildDatabase
  );
  const loadBuildAiPrompts = useAppContext(
    (v) => v.requestHelpers.loadBuildAiPrompts
  );
  const callBuildAiChat = useAppContext(
    (v) => v.requestHelpers.callBuildAiChat
  );
  const listBuildArtifacts = useAppContext(
    (v) => v.requestHelpers.listBuildArtifacts
  );
  const listBuildArtifactVersions = useAppContext(
    (v) => v.requestHelpers.listBuildArtifactVersions
  );
  const restoreBuildArtifactVersion = useAppContext(
    (v) => v.requestHelpers.restoreBuildArtifactVersion
  );
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const onUpdateUserMissionState = useAppContext(
    (v) => v.user.actions.onUpdateUserMissionState
  );

  const downloadBuildDatabaseRef = useRef(downloadBuildDatabase);
  const uploadBuildDatabaseRef = useRef(uploadBuildDatabase);
  const loadBuildAiPromptsRef = useRef(loadBuildAiPrompts);
  const callBuildAiChatRef = useRef(callBuildAiChat);
  const listBuildArtifactsRef = useRef(listBuildArtifacts);
  const listBuildArtifactVersionsRef = useRef(listBuildArtifactVersions);
  const restoreBuildArtifactVersionRef = useRef(restoreBuildArtifactVersion);
  const updateMissionStatusRef = useRef(updateMissionStatus);
  const onUpdateUserMissionStateRef = useRef(onUpdateUserMissionState);

  // Inject SDK into user code
  const codeWithSdk = useMemo(() => {
    if (!code) return null;

    // Insert SDK script right after <head> tag
    if (code.includes('<head>')) {
      return code.replace('<head>', '<head>' + TWINKLE_SDK_SCRIPT);
    }

    // If no head tag, insert before first script or at start of body
    if (code.includes('<body>')) {
      return code.replace('<body>', '<body>' + TWINKLE_SDK_SCRIPT);
    }

    // Fallback: prepend to entire code
    return TWINKLE_SDK_SCRIPT + code;
  }, [code]);

  const previewSrc = useMemo(() => {
    if (!codeWithSdk) return null;
    const blob = new Blob([codeWithSdk], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [codeWithSdk]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    setArtifactId(build.primaryArtifactId ?? null);
  }, [build.primaryArtifactId]);

  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  useEffect(() => {
    userIdRef.current = userId || null;
  }, [userId]);

  useEffect(() => {
    missionProgressRef.current = {
      promptListUsed,
      aiChatUsed,
      dbUsed
    };
  }, [promptListUsed, aiChatUsed, dbUsed]);

  useEffect(() => {
    if (historyOpen) {
      void loadVersions();
    }
  }, [historyOpen, artifactId]);

  async function loadVersions() {
    if (!isOwnerRef.current) {
      setVersions([]);
      return;
    }
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setLoadingVersions(true);
    try {
      let activeArtifactId = artifactId;
      if (!activeArtifactId) {
        const artifactsData = await listBuildArtifactsRef.current(activeBuild.id);
        activeArtifactId = artifactsData?.artifacts?.[0]?.id ?? null;
        if (activeArtifactId) {
          setArtifactId(activeArtifactId);
        }
      }

      if (!activeArtifactId) {
        setVersions([]);
        return;
      }

      const data = await listBuildArtifactVersionsRef.current({
        buildId: activeBuild.id,
        artifactId: activeArtifactId,
        limit: 50
      });
      setVersions(data?.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleSaveSnapshot() {
    if (!isOwnerRef.current || savingVersion || !code) return;
    await onSaveVersion('Manual snapshot');
    if (historyOpen) {
      await loadVersions();
    }
  }

  async function handleRestoreVersion(versionId: number) {
    if (!isOwnerRef.current || !artifactId || restoringVersionId) return;
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setRestoringVersionId(versionId);
    try {
      const result = await restoreBuildArtifactVersionRef.current({
        buildId: activeBuild.id,
        artifactId,
        versionId
      });
      if (result?.code) {
        onReplaceCode(result.code);
      }
      if (historyOpen) {
        await loadVersions();
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
    setRestoringVersionId(null);
  }

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'twinkle-build') return;

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      if (event.source !== iframe.contentWindow) return;

      const { id, type, payload } = data;
      const activeBuild = buildRef.current;
      const owner = isOwnerRef.current;

      try {
        let response: any = {};

        switch (type) {
          case 'init':
            response = {
              id: activeBuild.id,
              title: activeBuild.title,
              username: activeBuild.username
            };
            break;

          case 'db:load':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const dbData = await downloadBuildDatabaseRef.current(activeBuild.id);
            if (dbData) {
              const bytes = new Uint8Array(dbData);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              response = { data: btoa(binary) };
            } else {
              response = { data: null };
            }
            break;

          case 'db:save':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const base64 = payload.data;
            const binaryStr = atob(base64);
            const len = binaryStr.length;
            const bytesArr = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytesArr[i] = binaryStr.charCodeAt(i);
            }
            const result = await uploadBuildDatabaseRef.current({
              buildId: activeBuild.id,
              data: bytesArr.buffer
            });
            response = result;
            break;

          case 'ai:list-prompts':
            const promptsData = await loadBuildAiPromptsRef.current();
            response = { prompts: promptsData?.prompts || [] };
            break;

          case 'ai:chat':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const aiResult = await callBuildAiChatRef.current({
              buildId: activeBuild.id,
              promptId: payload.promptId,
              message: payload.message,
              history: payload.history
            });
            response = aiResult;
            break;

          default:
            throw new Error(`Unknown request type: ${type}`);
        }

        iframe.contentWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            payload: response
          },
          '*'
        );

        if (owner) {
          if (type === 'ai:chat') {
            void handleMissionProgress({
              promptListUsed: true,
              aiChatUsed: true
            });
          }
          if (type === 'ai:list-prompts') {
            void handleMissionProgress({ promptListUsed: true });
          }
          if (type === 'db:load' || type === 'db:save') {
            void handleMissionProgress({ dbUsed: true });
          }
        }
      } catch (error: any) {
        iframe.contentWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            error: error.message || 'Unknown error'
          },
          '*'
        );
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={panelClass}>
      <div className={toolbarClass}>
        <div className={toolbarTitleClass}>
          <Icon icon="laptop-code" />
          Workspace
        </div>
        <div className={toolbarActionsClass}>
          {isOwner && (
            <>
              <button
                className={actionButtonClass}
                onClick={handleSaveSnapshot}
                disabled={!code || savingVersion}
              >
                <Icon icon="save" />
                {savingVersion ? 'Saving...' : 'Save Version'}
              </button>
              <button
                className={ghostActionButtonClass}
                onClick={() => setHistoryOpen(true)}
              >
                <Icon icon="clock" />
                History
              </button>
            </>
          )}
          <div className={toggleGroupClass}>
            <button
              onClick={() => setViewMode('preview')}
            className={toggleButtonClass}
            style={
              viewMode === 'preview'
                ? { background: 'var(--theme-bg)', color: 'var(--theme-text)' }
                : undefined
            }
          >
              <Icon icon="eye" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
            className={toggleButtonClass}
            style={
              viewMode === 'code'
                ? { background: 'var(--theme-bg)', color: 'var(--theme-text)' }
                : undefined
            }
          >
              <Icon icon="code" />
              Code
            </button>
          </div>
        </div>
      </div>

      <div
        className={css`
          flex: 1;
          overflow: hidden;
          background: #fff;
          min-height: 0;
        `}
      >
        {viewMode === 'preview' ? (
          code && previewSrc ? (
            <iframe
              ref={iframeRef}
              src={previewSrc}
              title="Preview"
              sandbox="allow-scripts"
              className={css`
                width: 100%;
                height: 100%;
                border: none;
                background: #fff;
              `}
            />
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--chat-text);
                text-align: center;
                padding: 2rem;
                background: #fff;
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.6 }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                No preview available yet
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--chat-text)',
                  opacity: 0.6
                }}
              >
                {isOwner
                  ? 'Use the chat to describe what you want to build'
                  : 'This build has no code yet'}
              </p>
            </div>
          )
        ) : (
          <div
            className={css`
              height: 100%;
              overflow: auto;
            `}
          >
            {code ? (
              <textarea
                value={code}
                onChange={(e) => isOwner && onCodeChange(e.target.value)}
                readOnly={!isOwner}
                spellCheck={false}
                className={css`
                  width: 100%;
                  height: 100%;
                  padding: 1rem;
                  border: none;
                  resize: none;
                  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                  font-size: 0.85rem;
                  line-height: 1.5;
                  background: #1e1e1e;
                  color: #d4d4d4;
                  &:focus {
                    outline: none;
                  }
                `}
              />
            ) : (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100%;
                  color: var(--chat-text);
                  background: #fff;
                `}
              >
                No code yet
              </div>
            )}
          </div>
        )}
      </div>
      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        size="md"
        modalKey="BuildVersionHistory"
        hasHeader={false}
        showCloseButton={false}
        bodyPadding={0}
        aria-label="Version history"
        style={{
          backgroundColor: '#fff',
          boxShadow: 'none',
          border: '1px solid var(--ui-border)'
        }}
      >
        <div className={historyModalShellClass}>
          <div className={historyModalHeaderClass}>
            <div className={historyModalTitleClass}>Version History</div>
            <button
              className={historyModalCloseButtonClass}
              onClick={() => setHistoryOpen(false)}
              type="button"
              aria-label="Close version history"
            >
              <Icon icon="times" />
            </button>
          </div>
          <div className={historyModalContentClass}>
          {loadingVersions ? (
            <div
              className={css`
                padding: 1rem;
                text-align: center;
                color: var(--chat-text);
                opacity: 0.7;
              `}
            >
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div
              className={css`
                padding: 1rem;
                text-align: center;
                color: var(--chat-text);
                opacity: 0.7;
              `}
            >
              No versions yet. Use "Save Version" or ask the AI to generate code.
            </div>
          ) : (
            versions.map((version) => (
              <div key={version.id} className={versionRowClass}>
                <div>
                  <div
                    className={css`
                      font-weight: 700;
                      color: var(--chat-text);
                    `}
                  >
                    v{version.version}
                  </div>
                  {version.summary ? (
                    <div
                      className={css`
                        font-size: 0.9rem;
                        color: var(--chat-text);
                        opacity: 0.75;
                      `}
                    >
                      {version.summary}
                    </div>
                  ) : null}
                  <div className={versionMetaClass}>
                    {timeSince(version.createdAt)} ·{' '}
                    {version.createdByRole === 'assistant' ? 'AI' : 'You'}
                    {version.gitCommitSha
                      ? ` · ${String(version.gitCommitSha).slice(0, 7)}`
                      : ''}
                  </div>
                </div>
                <button
                  className={ghostActionButtonClass}
                  onClick={() => handleRestoreVersion(version.id)}
                  disabled={restoringVersionId === version.id}
                >
                  {restoringVersionId === version.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            ))
          )}
          </div>
        </div>
      </Modal>
    </div>
  );

  async function handleMissionProgress(newState: {
    promptListUsed?: boolean;
    aiChatUsed?: boolean;
    dbUsed?: boolean;
  }) {
    if (!userIdRef.current || !isOwnerRef.current) return;
    const current = missionProgressRef.current;
    const nextState: {
      promptListUsed?: boolean;
      aiChatUsed?: boolean;
      dbUsed?: boolean;
    } = {};

    if (newState.promptListUsed && !current.promptListUsed) {
      nextState.promptListUsed = true;
    }
    if (newState.aiChatUsed && !current.aiChatUsed) {
      nextState.aiChatUsed = true;
    }
    if (newState.dbUsed && !current.dbUsed) {
      nextState.dbUsed = true;
    }

    if (Object.keys(nextState).length === 0) return;

    missionProgressRef.current = { ...current, ...nextState };
    onUpdateUserMissionStateRef.current({
      missionType: 'build',
      newState: nextState
    });
    try {
      await updateMissionStatusRef.current({
        missionType: 'build',
        newStatus: nextState
      });
    } catch {
      return;
    }
  }
}
