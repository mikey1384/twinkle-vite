import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
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
}

interface ArtifactVersion {
  id: number;
  version: number;
  summary: string | null;
  gitCommitSha: string | null;
  createdAt: number;
  createdByRole: 'user' | 'assistant';
}

interface PreviewSeedCacheEntry {
  buildId: number;
  codeSignature: string;
  src: string;
  cachedAt: number;
}

interface PreviewFrameMeta {
  buildId: number | null;
  codeSignature: string | null;
}

interface DocsConnectResult {
  success: boolean;
  message: string | null;
  buildId: number | null;
  connectNonce: string | null;
}

interface PendingDocsConnectRequest {
  buildId: number;
  promise: Promise<DocsConnectResult>;
}

const PREVIEW_SEED_CACHE_TTL_MS = 10 * 60 * 1000;
const PREVIEW_SEED_CACHE_MAX_ENTRIES = 8;
const previewSeedCache = new Map<number, PreviewSeedCacheEntry>();
const MUTATING_PREVIEW_REQUEST_TYPES = new Set([
  'ai:chat',
  'docs:connect-start',
  'docs:disconnect',
  'llm:generate',
  'db:save',
  'jobs:cancel',
  'jobs:claim-due',
  'jobs:schedule',
  'mail:send',
  'private-db:remove',
  'private-db:set',
  'shared-db:add-entry',
  'shared-db:create-topic',
  'shared-db:delete-entry',
  'shared-db:update-entry',
  'social:follow',
  'social:unfollow',
  'viewer-db:exec',
  'vocabulary:collect-word'
]);

function hashPreviewCode(code: string) {
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function buildPreviewCodeSignature(codeWithSdk: string | null) {
  if (!codeWithSdk) return null;
  return `${codeWithSdk.length}:${hashPreviewCode(codeWithSdk)}`;
}

function revokePreviewUrl(src: string | null | undefined) {
  if (!src) return;
  try {
    URL.revokeObjectURL(src);
  } catch {
    // no-op
  }
}

function prunePreviewSeedCache() {
  const now = Date.now();
  for (const [buildId, entry] of previewSeedCache.entries()) {
    if (now - entry.cachedAt > PREVIEW_SEED_CACHE_TTL_MS) {
      revokePreviewUrl(entry.src);
      previewSeedCache.delete(buildId);
    }
  }

  if (previewSeedCache.size <= PREVIEW_SEED_CACHE_MAX_ENTRIES) return;

  const oldestEntries = Array.from(previewSeedCache.entries()).sort(
    (a, b) => a[1].cachedAt - b[1].cachedAt
  );
  const overflow = previewSeedCache.size - PREVIEW_SEED_CACHE_MAX_ENTRIES;
  for (let i = 0; i < overflow; i++) {
    const [buildId, entry] = oldestEntries[i];
    revokePreviewUrl(entry.src);
    previewSeedCache.delete(buildId);
  }
}

function takeCachedPreviewSeed(buildId: number, codeSignature: string | null) {
  prunePreviewSeedCache();
  if (!codeSignature) return null;
  const entry = previewSeedCache.get(buildId);
  if (!entry) return null;
  if (entry.codeSignature !== codeSignature) return null;
  previewSeedCache.delete(buildId);
  return entry;
}

function putCachedPreviewSeed(entry: PreviewSeedCacheEntry) {
  prunePreviewSeedCache();
  const existing = previewSeedCache.get(entry.buildId);
  if (existing?.src && existing.src !== entry.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.set(entry.buildId, entry);
  prunePreviewSeedCache();
}

function clearCachedPreviewSeed(buildId: number) {
  const existing = previewSeedCache.get(buildId);
  if (existing?.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.delete(buildId);
}

function isMutatingPreviewRequestType(type: string) {
  return MUTATING_PREVIEW_REQUEST_TYPES.has(type);
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
  let viewerInfo = null;

  function getRequestId() {
    return 'twinkle_' + (++requestId) + '_' + Date.now();
  }

  function resolveRequestTimeoutMs(type, options) {
    const requestedTimeout = Number(options && options.timeoutMs);
    if (Number.isFinite(requestedTimeout) && requestedTimeout > 0) {
      return requestedTimeout;
    }
    if (type === 'docs:connect-start') {
      return 16 * 60 * 1000;
    }
    if (type === 'llm:generate') {
      // Backend provider retries can run up to ~15 minutes total.
      // Keep iframe timeout above that window to avoid client-side false timeouts.
      return 20 * 60 * 1000;
    }
    return 30000;
  }

  function sendRequest(type, payload, options) {
    return new Promise((resolve, reject) => {
      const id = getRequestId();
      const timeoutMs = resolveRequestTimeoutMs(type, options);
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }, timeoutMs);

      pendingRequests.set(id, { resolve, reject, timeout });

      window.parent.postMessage({
        source: 'twinkle-build',
        id: id,
        type: type,
        payload: payload
      }, '*');
    });
  }

  function applyViewerInfo(info) {
    viewerInfo = info || null;
    if (!window.Twinkle || !window.Twinkle.viewer) return;
    const viewer = window.Twinkle.viewer;
    if (!info) {
      viewer.id = null;
      viewer.username = null;
      viewer.profilePicUrl = null;
      viewer.isLoggedIn = false;
      viewer.isOwner = false;
      return;
    }
    viewer.id = info.id || null;
    viewer.username = info.username || null;
    viewer.profilePicUrl = info.profilePicUrl || null;
    viewer.isLoggedIn = Boolean(info.isLoggedIn);
    viewer.isOwner = Boolean(info.isOwner);
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

    viewer: {
      id: null,
      username: null,
      profilePicUrl: null,
      isLoggedIn: false,
      isOwner: false,

      async get() {
        if (viewerInfo) return viewerInfo;
        const response = await sendRequest('viewer:get', {});
        applyViewerInfo(response?.viewer);
        return viewerInfo;
      },

      async refresh() {
        viewerInfo = null;
        return await this.get();
      }
    },

    viewerDb: {
      async query(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:query', { sql: sql, params: params });
      },

      async exec(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:exec', { sql: sql, params: params });
      }
    },

    api: {
      async getCurrentUser() {
        return await this.getViewer();
      },

      async getViewer() {
        return await window.Twinkle.viewer.get();
      },

      async getUser(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('api:get-user', { userId: userId });
        if (result?.user) return result.user;
        if (result && typeof result === 'object') return result;
        return null;
      },

      async getUsers({ search, userIds, cursor, limit } = {}) {
        return await sendRequest('api:get-users', {
          search: search,
          userIds: userIds,
          cursor: cursor,
          limit: limit
        });
      },

      async getDailyReflections({ following, userIds, lastId, cursor, limit } = {}) {
        return await sendRequest('api:get-daily-reflections', {
          following: following,
          userIds: userIds,
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      },

      async getDailyReflectionsByUser(userId, { lastId, cursor, limit } = {}) {
        if (!userId) throw new Error('userId is required');
        return await sendRequest('api:get-daily-reflections', {
          userIds: [userId],
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      },

      async getAICardMarketTrades({ cardId, side, since, until, cursor, limit } = {}) {
        return await sendRequest('api:get-ai-card-market-trades', {
          cardId: cardId,
          side: side,
          since: since,
          until: until,
          cursor: cursor,
          limit: limit
        });
      },

      async getAICardMarketCandles({ cardId, side, since, until, bucketSeconds, limit } = {}) {
        return await sendRequest('api:get-ai-card-market-candles', {
          cardId: cardId,
          side: side,
          since: since,
          until: until,
          bucketSeconds: bucketSeconds,
          limit: limit
        });
      }
    },

    docs: {
      async status() {
        return await sendRequest('docs:status', {});
      },

      async connect() {
        const result = await sendRequest('docs:connect-start', {}, {
          timeoutMs: 16 * 60 * 1000
        });
        return {
          success: Boolean(result?.success),
          message: result?.message || null,
          buildId: result?.buildId || null,
          connectNonce: result?.connectNonce || null
        };
      },

      async disconnect() {
        return await sendRequest('docs:disconnect', {});
      },

      async listFiles(opts) {
        var options = opts || {};
        return await sendRequest('docs:list-files', {
          query: options.query,
          pageToken: options.pageToken,
          pageSize: options.pageSize
        });
      },

      async getDoc(docId) {
        if (!docId) throw new Error('docId is required');
        return await sendRequest('docs:get-doc', { docId: docId });
      },

      async getDocText(docId) {
        if (!docId) throw new Error('docId is required');
        return await sendRequest('docs:get-doc-text', { docId: docId });
      },

      async search(query, opts) {
        if (!query) throw new Error('query is required');
        var options = opts || {};
        return await sendRequest('docs:search', {
          query: query,
          pageToken: options.pageToken,
          pageSize: options.pageSize
        });
      }
    },

    llm: {
      async listModels() {
        return await sendRequest('llm:list-models', {});
      },

      async generate(opts) {
        var options = opts || {};
        if (!options.prompt && !Array.isArray(options.messages)) {
          throw new Error('prompt or messages is required');
        }
        return await sendRequest(
          'llm:generate',
          {
            model: options.model,
            prompt: options.prompt,
            system: options.system,
            messages: options.messages,
            maxOutputTokens: options.maxOutputTokens
          },
          { timeoutMs: options.timeoutMs }
        );
      }
    },

    social: {
      async follow(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('social:follow', { userId: userId });
        return {
          success: Boolean(result?.success),
          isFollowing:
            typeof result?.isFollowing === 'boolean'
              ? result.isFollowing
              : Boolean(result?.alreadyFollowing)
        };
      },

      async unfollow(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('social:unfollow', { userId: userId });
        return {
          success: Boolean(result?.success),
          isFollowing:
            typeof result?.isFollowing === 'boolean'
              ? result.isFollowing
              : false
        };
      },

      async getFollowing({ limit, offset } = {}) {
        const result = await sendRequest('social:get-following', {
          limit,
          offset
        });
        if (Array.isArray(result)) return { following: result };
        return { following: Array.isArray(result?.following) ? result.following : [] };
      },

      async getFollowers({ limit, offset } = {}) {
        const result = await sendRequest('social:get-followers', {
          limit,
          offset
        });
        if (Array.isArray(result)) return { followers: result };
        return { followers: Array.isArray(result?.followers) ? result.followers : [] };
      },

      async isFollowing(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('social:is-following', { userId: userId });
        return result?.isFollowing || false;
      }
    },

    content: {
      async getMySubjects(opts) {
        var options = opts || {};
        return await sendRequest('content:my-subjects', {
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async getSubject(subjectId) {
        if (!subjectId) throw new Error('subjectId is required');
        return await sendRequest('content:subject', { subjectId: subjectId });
      },

      async getSubjectComments(subjectId, opts) {
        if (!subjectId) throw new Error('subjectId is required');
        var options = opts || {};
        return await sendRequest('content:subject-comments', {
          subjectId: subjectId,
          limit: options.limit,
          cursor: options.cursor
        });
      }
    },

    vocabulary: {
      async lookupWord(word) {
        if (!word) throw new Error('word is required');
        return await sendRequest('vocabulary:lookup-word', { word: word });
      },

      async collectWord(word) {
        if (!word) throw new Error('word is required');
        return await sendRequest('vocabulary:collect-word', { word: word });
      },

      async getBreakStatus() {
        return await sendRequest('vocabulary:break-status', {});
      },

      async getCollectedWords(opts) {
        var options = opts || {};
        return await sendRequest('vocabulary:collected-words', {
          limit: options.limit,
          cursor: options.cursor
        });
      }
    },

    sharedDb: {
      async getTopics() {
        return await sendRequest('shared-db:get-topics', {});
      },

      async createTopic(name) {
        if (!name) throw new Error('name is required');
        return await sendRequest('shared-db:create-topic', { name: name });
      },

      async getEntries(topicName, opts) {
        if (!topicName) throw new Error('topicName is required');
        var options = opts || {};
        return await sendRequest('shared-db:get-entries', {
          topicName: topicName,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async addEntry(topicName, data) {
        if (!topicName) throw new Error('topicName is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:add-entry', {
          topicName: topicName,
          data: data
        });
      },

      async updateEntry(entryId, data) {
        if (!entryId) throw new Error('entryId is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:update-entry', {
          entryId: entryId,
          data: data
        });
      },

      async deleteEntry(entryId) {
        if (!entryId) throw new Error('entryId is required');
        return await sendRequest('shared-db:delete-entry', {
          entryId: entryId
        });
      }
    },

    privateDb: {
      async get(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:get', { key: key });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('private-db:list', {
          prefix: options.prefix,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async set(key, value) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:set', {
          key: key,
          value: value
        });
      },

      async remove(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:remove', { key: key });
      }
    },

    jobs: {
      async schedule(opts) {
        var options = opts || {};
        if (!options.name) throw new Error('name is required');
        if (!options.runAt) throw new Error('runAt is required');
        return await sendRequest('jobs:schedule', {
          name: options.name,
          runAt: options.runAt,
          intervalSeconds: options.intervalSeconds,
          maxRuns: options.maxRuns,
          data: options.data,
          scope: options.scope
        });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('jobs:list', {
          scope: options.scope,
          status: options.status,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async cancel(jobId) {
        if (!jobId) throw new Error('jobId is required');
        return await sendRequest('jobs:cancel', { jobId: jobId });
      },

      async claimDue(opts) {
        var options = opts || {};
        return await sendRequest('jobs:claim-due', {
          scope: options.scope,
          limit: options.limit
        });
      }
    },

    mail: {
      async send(opts) {
        var options = opts || {};
        if (!options.to) throw new Error('to is required');
        if (!options.subject) throw new Error('subject is required');
        return await sendRequest('mail:send', {
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          from: options.from,
          replyTo: options.replyTo,
          meta: options.meta
        });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('mail:list', {
          status: options.status,
          limit: options.limit,
          cursor: options.cursor
        });
      }
    },

    build: { id: null, title: null, username: null },
    _init(info) {
      this.build.id = info.id;
      this.build.title = info.title;
      this.build.username = info.username;
      applyViewerInfo(info.viewer);
    }
  };

  sendRequest('init', {}).then(info => {
    if (info) window.Twinkle._init(info);
  }).catch(() => {});

  console.log('Twinkle SDK loaded');
})();
</script>
`;

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const panelClass = css`
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  background: #fff;
  gap: 0;
  overflow: hidden;
`;

const toolbarClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: var(--build-workspace-header-height);
  padding: 0 1rem;
  column-gap: 0.75rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    row-gap: 0.65rem;
    padding: 0.9rem 1rem;
  }
`;

const toolbarTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 1.2rem;
  font-family: ${displayFontFamily};
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const previewStageClass = css`
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: hidden;
`;

const previewPreloadSurfaceClass = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  background: #fafbff;
  color: var(--chat-text);
  z-index: 1;
`;

const previewPreloadIconWrapClass = css`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const previewPreloadLabelClass = css`
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0.82;
`;

const previewIframeClass = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  transition: opacity 0.18s ease;
`;

const previewLoadingOverlayClass = css`
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--chat-text);
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 4;
  backdrop-filter: blur(1px);
`;

const previewSpinnerClass = css`
  animation: previewSpin 0.9s linear infinite;
  @keyframes previewSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
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
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
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

const workspaceViewOptions = [
  { value: 'preview', label: 'Preview', icon: 'eye' },
  { value: 'code', label: 'Code', icon: 'code' }
] as const;

export default function PreviewPanel({
  build,
  code,
  isOwner,
  onCodeChange,
  onReplaceCode
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [activePreviewFrame, setActivePreviewFrame] = useState<
    'primary' | 'secondary'
  >('primary');
  const [previewFrameSources, setPreviewFrameSources] = useState<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const [previewFrameReady, setPreviewFrameReady] = useState<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const [previewTransitioning, setPreviewTransitioning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(
    null
  );
  const [artifactId, setArtifactId] = useState<number | null>(
    build.primaryArtifactId ?? null
  );
  const primaryIframeRef = useRef<HTMLIFrameElement>(null);
  const secondaryIframeRef = useRef<HTMLIFrameElement>(null);
  const activePreviewFrameRef = useRef<'primary' | 'secondary'>('primary');
  const messageTargetFrameRef = useRef<'primary' | 'secondary'>('primary');
  const previewTransitioningRef = useRef(false);
  const previewFrameMetaRef = useRef<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>({
    primary: { buildId: null, codeSignature: null },
    secondary: { buildId: null, codeSignature: null }
  });
  const previewFrameSourcesRef = useRef<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const previewFrameReadyRef = useRef<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const buildRef = useRef(build);
  const isOwnerRef = useRef(isOwner);
  const userIdRef = useRef<number | null>(null);
  const usernameRef = useRef<string | null>(null);
  const profilePicUrlRef = useRef<string | null>(null);
  const missionProgressRef = useRef({
    promptListUsed: false,
    aiChatUsed: false,
    dbUsed: false
  });

  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
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
  const followBuildUser = useAppContext(
    (v) => v.requestHelpers.followBuildUser
  );
  const unfollowBuildUser = useAppContext(
    (v) => v.requestHelpers.unfollowBuildUser
  );
  const loadBuildFollowers = useAppContext(
    (v) => v.requestHelpers.loadBuildFollowers
  );
  const loadBuildFollowing = useAppContext(
    (v) => v.requestHelpers.loadBuildFollowing
  );
  const isFollowingBuildUser = useAppContext(
    (v) => v.requestHelpers.isFollowingBuildUser
  );
  const queryViewerDb = useAppContext((v) => v.requestHelpers.queryViewerDb);
  const execViewerDb = useAppContext((v) => v.requestHelpers.execViewerDb);
  const getBuildApiToken = useAppContext(
    (v) => v.requestHelpers.getBuildApiToken
  );
  const getBuildApiUser = useAppContext(
    (v) => v.requestHelpers.getBuildApiUser
  );
  const getBuildApiUsers = useAppContext(
    (v) => v.requestHelpers.getBuildApiUsers
  );
  const getBuildDailyReflections = useAppContext(
    (v) => v.requestHelpers.getBuildDailyReflections
  );
  const getBuildAICardMarketTrades = useAppContext(
    (v) => v.requestHelpers.getBuildAICardMarketTrades
  );
  const getBuildAICardMarketCandles = useAppContext(
    (v) => v.requestHelpers.getBuildAICardMarketCandles
  );
  const getBuildDocsStatus = useAppContext(
    (v) => v.requestHelpers.getBuildDocsStatus
  );
  const startBuildDocsConnect = useAppContext(
    (v) => v.requestHelpers.startBuildDocsConnect
  );
  const disconnectBuildDocs = useAppContext(
    (v) => v.requestHelpers.disconnectBuildDocs
  );
  const listBuildDocsFiles = useAppContext(
    (v) => v.requestHelpers.listBuildDocsFiles
  );
  const getBuildDoc = useAppContext((v) => v.requestHelpers.getBuildDoc);
  const getBuildDocText = useAppContext(
    (v) => v.requestHelpers.getBuildDocText
  );
  const searchBuildDocs = useAppContext(
    (v) => v.requestHelpers.searchBuildDocs
  );
  const listBuildLlmModels = useAppContext(
    (v) => v.requestHelpers.listBuildLlmModels
  );
  const generateBuildLlmResponse = useAppContext(
    (v) => v.requestHelpers.generateBuildLlmResponse
  );
  const lookupBuildVocabularyWord = useAppContext(
    (v) => v.requestHelpers.lookupBuildVocabularyWord
  );
  const collectBuildVocabularyWord = useAppContext(
    (v) => v.requestHelpers.collectBuildVocabularyWord
  );
  const getBuildVocabularyBreakStatus = useAppContext(
    (v) => v.requestHelpers.getBuildVocabularyBreakStatus
  );
  const getBuildCollectedVocabularyWords = useAppContext(
    (v) => v.requestHelpers.getBuildCollectedVocabularyWords
  );
  const getBuildMySubjects = useAppContext(
    (v) => v.requestHelpers.getBuildMySubjects
  );
  const getBuildSubject = useAppContext(
    (v) => v.requestHelpers.getBuildSubject
  );
  const getBuildSubjectComments = useAppContext(
    (v) => v.requestHelpers.getBuildSubjectComments
  );
  const getSharedDbTopics = useAppContext(
    (v) => v.requestHelpers.getSharedDbTopics
  );
  const createSharedDbTopic = useAppContext(
    (v) => v.requestHelpers.createSharedDbTopic
  );
  const getSharedDbEntries = useAppContext(
    (v) => v.requestHelpers.getSharedDbEntries
  );
  const addSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.addSharedDbEntry
  );
  const updateSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.updateSharedDbEntry
  );
  const deleteSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbEntry
  );
  const getPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.getPrivateDbItem
  );
  const listPrivateDbItems = useAppContext(
    (v) => v.requestHelpers.listPrivateDbItems
  );
  const setPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.setPrivateDbItem
  );
  const deletePrivateDbItem = useAppContext(
    (v) => v.requestHelpers.deletePrivateDbItem
  );
  const scheduleBuildJob = useAppContext(
    (v) => v.requestHelpers.scheduleBuildJob
  );
  const listBuildJobs = useAppContext((v) => v.requestHelpers.listBuildJobs);
  const cancelBuildJob = useAppContext((v) => v.requestHelpers.cancelBuildJob);
  const claimDueBuildJobs = useAppContext(
    (v) => v.requestHelpers.claimDueBuildJobs
  );
  const sendBuildMail = useAppContext((v) => v.requestHelpers.sendBuildMail);
  const listBuildMail = useAppContext((v) => v.requestHelpers.listBuildMail);
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
  const followBuildUserRef = useRef(followBuildUser);
  const unfollowBuildUserRef = useRef(unfollowBuildUser);
  const loadBuildFollowersRef = useRef(loadBuildFollowers);
  const loadBuildFollowingRef = useRef(loadBuildFollowing);
  const isFollowingBuildUserRef = useRef(isFollowingBuildUser);
  const queryViewerDbRef = useRef(queryViewerDb);
  const execViewerDbRef = useRef(execViewerDb);
  const getBuildApiTokenRef = useRef(getBuildApiToken);
  const getBuildApiUserRef = useRef(getBuildApiUser);
  const getBuildApiUsersRef = useRef(getBuildApiUsers);
  const getBuildDailyReflectionsRef = useRef(getBuildDailyReflections);
  const getBuildAICardMarketTradesRef = useRef(getBuildAICardMarketTrades);
  const getBuildAICardMarketCandlesRef = useRef(getBuildAICardMarketCandles);
  const getBuildDocsStatusRef = useRef(getBuildDocsStatus);
  const startBuildDocsConnectRef = useRef(startBuildDocsConnect);
  const disconnectBuildDocsRef = useRef(disconnectBuildDocs);
  const listBuildDocsFilesRef = useRef(listBuildDocsFiles);
  const getBuildDocRef = useRef(getBuildDoc);
  const getBuildDocTextRef = useRef(getBuildDocText);
  const searchBuildDocsRef = useRef(searchBuildDocs);
  const listBuildLlmModelsRef = useRef(listBuildLlmModels);
  const generateBuildLlmResponseRef = useRef(generateBuildLlmResponse);
  const lookupBuildVocabularyWordRef = useRef(lookupBuildVocabularyWord);
  const collectBuildVocabularyWordRef = useRef(collectBuildVocabularyWord);
  const getBuildVocabularyBreakStatusRef = useRef(
    getBuildVocabularyBreakStatus
  );
  const getBuildCollectedVocabularyWordsRef = useRef(
    getBuildCollectedVocabularyWords
  );
  const getBuildMySubjectsRef = useRef(getBuildMySubjects);
  const getBuildSubjectRef = useRef(getBuildSubject);
  const getBuildSubjectCommentsRef = useRef(getBuildSubjectComments);
  const getSharedDbTopicsRef = useRef(getSharedDbTopics);
  const createSharedDbTopicRef = useRef(createSharedDbTopic);
  const getSharedDbEntriesRef = useRef(getSharedDbEntries);
  const addSharedDbEntryRef = useRef(addSharedDbEntry);
  const updateSharedDbEntryRef = useRef(updateSharedDbEntry);
  const deleteSharedDbEntryRef = useRef(deleteSharedDbEntry);
  const getPrivateDbItemRef = useRef(getPrivateDbItem);
  const listPrivateDbItemsRef = useRef(listPrivateDbItems);
  const setPrivateDbItemRef = useRef(setPrivateDbItem);
  const deletePrivateDbItemRef = useRef(deletePrivateDbItem);
  const scheduleBuildJobRef = useRef(scheduleBuildJob);
  const listBuildJobsRef = useRef(listBuildJobs);
  const cancelBuildJobRef = useRef(cancelBuildJob);
  const claimDueBuildJobsRef = useRef(claimDueBuildJobs);
  const sendBuildMailRef = useRef(sendBuildMail);
  const listBuildMailRef = useRef(listBuildMail);
  const updateMissionStatusRef = useRef(updateMissionStatus);
  const onUpdateUserMissionStateRef = useRef(onUpdateUserMissionState);

  const buildApiTokenRef = useRef<{
    token: string;
    scopes: string[];
    expiresAt: number;
  } | null>(null);
  const docsConnectInFlightRef = useRef<PendingDocsConnectRequest | null>(null);
  const docsConnectPopupRef = useRef<Window | null>(null);

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
  const previewCodeSignature = useMemo(
    () => buildPreviewCodeSignature(codeWithSdk),
    [codeWithSdk]
  );

  useEffect(() => {
    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';
    const currentSources = previewFrameSourcesRef.current;
    let activeSrc = currentSources[activeFrame];
    let inactiveSrc = currentSources[inactiveFrame];
    let seededFromCache = false;

    if (!activeSrc && !inactiveSrc && previewCodeSignature) {
      const cached = takeCachedPreviewSeed(build.id, previewCodeSignature);
      if (cached?.src) {
        const seededSources = {
          ...currentSources,
          [activeFrame]: cached.src
        };
        previewFrameSourcesRef.current = seededSources;
        setPreviewFrameSources(seededSources);
        const seededMeta = {
          ...previewFrameMetaRef.current,
          [activeFrame]: {
            buildId: build.id,
            codeSignature: cached.codeSignature || previewCodeSignature
          }
        };
        previewFrameMetaRef.current = seededMeta;
        const seededReady = {
          ...previewFrameReadyRef.current,
          [activeFrame]: false
        };
        previewFrameReadyRef.current = seededReady;
        setPreviewFrameReady(seededReady);
        activeSrc = cached.src;
        messageTargetFrameRef.current = activeFrame;
        seededFromCache = true;
      }
    }

    if (!previewSrc) {
      clearCachedPreviewSeed(build.id);
      if (currentSources.primary) {
        URL.revokeObjectURL(currentSources.primary);
      }
      if (
        currentSources.secondary &&
        currentSources.secondary !== currentSources.primary
      ) {
        URL.revokeObjectURL(currentSources.secondary);
      }
      const cleared = { primary: null, secondary: null };
      previewFrameSourcesRef.current = cleared;
      setPreviewFrameSources(cleared);
      previewFrameMetaRef.current = {
        primary: { buildId: null, codeSignature: null },
        secondary: { buildId: null, codeSignature: null }
      };
      const clearedReady = { primary: false, secondary: false };
      previewFrameReadyRef.current = clearedReady;
      setPreviewFrameReady(clearedReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (seededFromCache) {
      URL.revokeObjectURL(previewSrc);
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (!activeSrc) {
      const nextSources = {
        ...currentSources,
        [activeFrame]: previewSrc
      };
      previewFrameSourcesRef.current = nextSources;
      setPreviewFrameSources(nextSources);
      const nextMeta = {
        ...previewFrameMetaRef.current,
        [activeFrame]: {
          buildId: build.id,
          codeSignature: previewCodeSignature
        }
      };
      previewFrameMetaRef.current = nextMeta;
      const nextReady = {
        ...previewFrameReadyRef.current,
        [activeFrame]: false
      };
      previewFrameReadyRef.current = nextReady;
      setPreviewFrameReady(nextReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = true;
      setPreviewTransitioning(true);
      return;
    }

    if (previewSrc === activeSrc || previewSrc === inactiveSrc) {
      const reusedFrame =
        previewSrc === activeSrc ? activeFrame : inactiveFrame;
      const currentMeta = previewFrameMetaRef.current[reusedFrame];
      const nextSignature = previewCodeSignature || currentMeta?.codeSignature;
      if (
        currentMeta?.buildId !== build.id ||
        currentMeta?.codeSignature !== nextSignature
      ) {
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [reusedFrame]: {
            buildId: build.id,
            codeSignature: nextSignature
          }
        };
      }
      return;
    }

    if (inactiveSrc && inactiveSrc !== previewSrc) {
      URL.revokeObjectURL(inactiveSrc);
    }

    const nextSources = {
      ...currentSources,
      [inactiveFrame]: previewSrc
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    const nextMeta = {
      ...previewFrameMetaRef.current,
      [inactiveFrame]: {
        buildId: build.id,
        codeSignature: previewCodeSignature
      }
    };
    previewFrameMetaRef.current = nextMeta;
    const nextReady = {
      ...previewFrameReadyRef.current,
      [inactiveFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
    messageTargetFrameRef.current = activeFrame;
    previewTransitioningRef.current = true;
    setPreviewTransitioning(true);
  }, [build.id, previewCodeSignature, previewSrc]);

  useEffect(() => {
    activePreviewFrameRef.current = activePreviewFrame;
  }, [activePreviewFrame]);

  useEffect(() => {
    previewFrameSourcesRef.current = previewFrameSources;
  }, [previewFrameSources]);

  useEffect(() => {
    previewFrameReadyRef.current = previewFrameReady;
  }, [previewFrameReady]);

  useEffect(() => {
    previewTransitioningRef.current = previewTransitioning;
  }, [previewTransitioning]);

  useEffect(() => {
    return () => {
      const activeFrame = activePreviewFrameRef.current;
      const sources = previewFrameSourcesRef.current;
      const ready = previewFrameReadyRef.current;
      const frameMeta = previewFrameMetaRef.current;
      const activeMeta = frameMeta[activeFrame];
      const activeSrc = sources[activeFrame];
      const shouldCacheActive =
        Boolean(activeSrc) &&
        ready[activeFrame] &&
        Boolean(activeMeta?.codeSignature) &&
        activeMeta?.buildId === buildRef.current?.id;

      if (
        shouldCacheActive &&
        activeSrc &&
        activeMeta?.buildId &&
        activeMeta?.codeSignature
      ) {
        putCachedPreviewSeed({
          buildId: activeMeta.buildId,
          codeSignature: activeMeta.codeSignature,
          src: activeSrc,
          cachedAt: Date.now()
        });
      } else if (activeSrc) {
        URL.revokeObjectURL(activeSrc);
      }

      if (sources.primary && sources.primary !== activeSrc) {
        URL.revokeObjectURL(sources.primary);
      }
      if (sources.secondary && sources.secondary !== sources.primary) {
        if (sources.secondary !== activeSrc) {
          URL.revokeObjectURL(sources.secondary);
        }
      }
    };
  }, []);

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
    usernameRef.current = username || null;
  }, [username]);

  useEffect(() => {
    profilePicUrlRef.current = profilePicUrl || null;
  }, [profilePicUrl]);

  async function ensureBuildApiToken(requiredScopes: string[]) {
    const now = Math.floor(Date.now() / 1000);
    const cached = buildApiTokenRef.current;
    if (
      cached &&
      cached.expiresAt - 30 > now &&
      requiredScopes.every((scope) => cached.scopes.includes(scope))
    ) {
      return cached.token;
    }

    const activeBuild = buildRef.current;
    if (!activeBuild?.id) {
      throw new Error('Build not found');
    }

    const scopeSet = new Set<string>([
      ...(cached?.scopes || []),
      ...requiredScopes
    ]);
    const requestedScopes = Array.from(scopeSet);

    const result = await getBuildApiTokenRef.current({
      buildId: activeBuild.id,
      scopes: requestedScopes
    });
    if (!result?.token) {
      throw new Error('Failed to obtain API token');
    }
    buildApiTokenRef.current = {
      token: result.token,
      scopes: result.scopes || requestedScopes,
      expiresAt: result.expiresAt || now + 600
    };
    return result.token;
  }

  function getViewerInfo() {
    return {
      id: userIdRef.current,
      username: usernameRef.current,
      profilePicUrl: profilePicUrlRef.current,
      isLoggedIn: Boolean(userIdRef.current),
      isOwner: Boolean(isOwnerRef.current)
    };
  }

  async function startDocsConnectViaHost(
    buildId: number
  ): Promise<DocsConnectResult> {
    let popup: Window | null = null;
    try {
      popup = window.open('', 'twinkle_docs_connect', 'width=560,height=720');
    } catch {
      popup = null;
    }
    if (!popup) {
      throw new Error('Popup blocked. Please allow popups and try again.');
    }

    docsConnectPopupRef.current = popup;
    try {
      popup.document.title = 'Connect Google Docs';
      popup.document.body.innerHTML =
        '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:24px;color:#444;">Opening Google Docs authorization...</div>';
    } catch {
      // no-op
    }

    try {
      const docsReadToken = await ensureBuildApiToken(['docs:read']);
      const start = await startBuildDocsConnectRef.current({
        buildId,
        token: docsReadToken
      });
      if (!start?.url) {
        throw new Error(
          start?.error || 'Failed to start Google Docs connection'
        );
      }

      if (popup.closed) {
        throw new Error(
          'Google Docs connection window was closed before completion.'
        );
      }

      const connectNonce =
        typeof start.connectNonce === 'string' && start.connectNonce.trim()
          ? start.connectNonce.trim()
          : null;
      const timeoutMs =
        Math.max(Number(start.timeoutSeconds || 600), 60) * 1000;

      try {
        popup.location.href = start.url;
      } catch {
        throw new Error('Failed to open Google Docs authorization window.');
      }

      return await new Promise((resolve, reject) => {
        let done = false;
        let closePoll: ReturnType<typeof setInterval> | null = null;
        let timeout: ReturnType<typeof setTimeout> | null = null;

        function cleanup() {
          if (done) return;
          done = true;
          window.removeEventListener('message', handleOAuthMessage);
          if (closePoll) {
            clearInterval(closePoll);
            closePoll = null;
          }
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          if (docsConnectPopupRef.current === popup) {
            docsConnectPopupRef.current = null;
          }
        }

        function handleOAuthMessage(event: MessageEvent) {
          if (event.source !== popup) return;
          const data = event?.data;
          if (!data || data.source !== 'twinkle-build-docs-oauth') return;
          if (connectNonce) {
            const incomingNonce =
              typeof data.connectNonce === 'string' ? data.connectNonce : '';
            if (incomingNonce !== connectNonce) {
              return;
            }
          }

          const parsedBuildId = Number(data.buildId);
          cleanup();
          try {
            if (popup && !popup.closed) popup.close();
          } catch {
            // no-op
          }
          resolve({
            success: Boolean(data.success),
            message: data.message ? String(data.message) : null,
            buildId:
              Number.isFinite(parsedBuildId) && parsedBuildId > 0
                ? parsedBuildId
                : buildId,
            connectNonce:
              typeof data.connectNonce === 'string'
                ? data.connectNonce
                : connectNonce
          });
        }

        window.addEventListener('message', handleOAuthMessage);

        closePoll = setInterval(() => {
          if (!popup || popup.closed) {
            cleanup();
            reject(
              new Error(
                'Google Docs connection window was closed before completion.'
              )
            );
          }
        }, 500);

        timeout = setTimeout(() => {
          cleanup();
          try {
            if (popup && !popup.closed) popup.close();
          } catch {
            // no-op
          }
          reject(
            new Error('Google Docs connection timed out. Please try again.')
          );
        }, timeoutMs);
      });
    } catch (error) {
      if (docsConnectPopupRef.current === popup) {
        docsConnectPopupRef.current = null;
      }
      try {
        if (popup && !popup.closed) popup.close();
      } catch {
        // no-op
      }
      throw error;
    }
  }

  useEffect(() => {
    missionProgressRef.current = {
      promptListUsed,
      aiChatUsed,
      dbUsed
    };
  }, [promptListUsed, aiChatUsed, dbUsed]);

  useEffect(() => {
    return () => {
      docsConnectInFlightRef.current = null;
      const popup = docsConnectPopupRef.current;
      docsConnectPopupRef.current = null;
      try {
        if (popup && !popup.closed) popup.close();
      } catch {
        // no-op
      }
    };
  }, []);

  useEffect(() => {
    if (historyOpen) {
      void loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const artifactsData = await listBuildArtifactsRef.current(
          activeBuild.id
        );
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

  function handlePreviewFrameLoad(
    frame: 'primary' | 'secondary',
    expectedSrc: string | null
  ) {
    if (!expectedSrc) return;
    const sources = previewFrameSourcesRef.current;
    if (sources[frame] !== expectedSrc) return;
    const nextReadyState = {
      ...previewFrameReadyRef.current,
      [frame]: true
    };
    previewFrameReadyRef.current = nextReadyState;
    setPreviewFrameReady(nextReadyState);

    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';

    if (frame === activeFrame) {
      messageTargetFrameRef.current = frame;
      if (!sources[inactiveFrame]) {
        previewTransitioningRef.current = false;
        setPreviewTransitioning(false);
      }
      return;
    }

    const outgoingSrc = sources[activeFrame];
    setActivePreviewFrame(frame);
    activePreviewFrameRef.current = frame;
    messageTargetFrameRef.current = frame;
    previewTransitioningRef.current = false;
    setPreviewTransitioning(false);

    if (outgoingSrc && outgoingSrc !== expectedSrc) {
      URL.revokeObjectURL(outgoingSrc);
    }

    const nextSources = {
      ...sources,
      [activeFrame]: null
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    const nextMeta = {
      ...previewFrameMetaRef.current,
      [activeFrame]: {
        buildId: null,
        codeSignature: null
      }
    };
    previewFrameMetaRef.current = nextMeta;
    const nextReady = {
      ...previewFrameReadyRef.current,
      [activeFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
  }

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'twinkle-build') return;
      const { id, type, payload } = data;

      const sourceWindow = event.source as Window | null;
      if (!sourceWindow) return;
      const primaryWindow = primaryIframeRef.current?.contentWindow || null;
      const secondaryWindow = secondaryIframeRef.current?.contentWindow || null;
      const sourceFrame =
        primaryWindow && sourceWindow === primaryWindow
          ? 'primary'
          : secondaryWindow && sourceWindow === secondaryWindow
            ? 'secondary'
            : null;
      if (!sourceFrame) return;
      const targetFrame = messageTargetFrameRef.current;
      const targetWindow =
        targetFrame === 'primary' ? primaryWindow : secondaryWindow;
      const alternateFrame =
        targetFrame === 'primary' ? 'secondary' : 'primary';
      const alternateWindow =
        alternateFrame === 'primary' ? primaryWindow : secondaryWindow;
      const frameMeta = previewFrameMetaRef.current;
      const activeBuild = buildRef.current;
      const activeBuildId = activeBuild?.id ?? null;
      if (!activeBuildId) return;
      const targetMeta = frameMeta[targetFrame];
      const alternateMeta = frameMeta[alternateFrame];
      const alternateHasSource = Boolean(
        previewFrameSourcesRef.current[alternateFrame]
      );
      const shouldAcceptAlternate =
        previewTransitioningRef.current &&
        alternateHasSource &&
        alternateMeta?.buildId === activeBuildId;
      const fromTargetWindow = Boolean(
        targetWindow &&
        sourceWindow === targetWindow &&
        targetMeta?.buildId === activeBuildId
      );
      const fromAlternateWindow = Boolean(
        alternateWindow &&
        sourceWindow === alternateWindow &&
        alternateMeta?.buildId === activeBuildId
      );
      if (
        !fromTargetWindow &&
        !(shouldAcceptAlternate && fromAlternateWindow)
      ) {
        return;
      }

      if (
        previewTransitioningRef.current &&
        isMutatingPreviewRequestType(type)
      ) {
        const mutationAuthorityFrame = shouldAcceptAlternate
          ? alternateFrame
          : targetFrame;
        if (sourceFrame !== mutationAuthorityFrame) {
          sourceWindow.postMessage(
            {
              source: 'twinkle-parent',
              id,
              error:
                'Preview is updating. This request was skipped to prevent duplicate side effects.'
            },
            '*'
          );
          return;
        }
      }

      // SECURITY: Validate the message came from our iframe, not an external source.
      // We use '*' for postMessage origin because blob/srcdoc iframes have null origins,
      // but we validate event.source to ensure messages only come from our preview iframes.
      const owner = isOwnerRef.current;

      try {
        let response: any = {};

        switch (type) {
          case 'init':
            response = {
              id: activeBuild.id,
              title: activeBuild.title,
              username: activeBuild.username,
              viewer: getViewerInfo()
            };
            break;

          case 'db:load':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const dbData = await downloadBuildDatabaseRef.current(
              activeBuild.id
            );
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

          case 'docs:status': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await getBuildDocsStatusRef.current({
              buildId: activeBuild.id,
              token: docsReadToken
            });
            break;
          }

          case 'docs:connect-start': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const inFlightRequest = docsConnectInFlightRef.current;
            if (inFlightRequest && inFlightRequest.buildId !== activeBuild.id) {
              throw new Error(
                'A Google Docs connection is already in progress for another build.'
              );
            }

            if (!inFlightRequest) {
              const promise = startDocsConnectViaHost(activeBuild.id).finally(
                () => {
                  if (docsConnectInFlightRef.current?.promise === promise) {
                    docsConnectInFlightRef.current = null;
                  }
                }
              );
              docsConnectInFlightRef.current = {
                buildId: activeBuild.id,
                promise
              };
            }
            response = await docsConnectInFlightRef.current?.promise;
            break;
          }

          case 'docs:disconnect': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsWriteToken = await ensureBuildApiToken(['docs:write']);
            response = await disconnectBuildDocsRef.current({
              buildId: activeBuild.id,
              token: docsWriteToken
            });
            break;
          }

          case 'docs:list-files': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await listBuildDocsFilesRef.current({
              buildId: activeBuild.id,
              query: payload?.query,
              pageToken: payload?.pageToken,
              pageSize: payload?.pageSize,
              token: docsReadToken
            });
            break;
          }

          case 'docs:get-doc': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await getBuildDocRef.current({
              buildId: activeBuild.id,
              docId: payload?.docId,
              token: docsReadToken
            });
            break;
          }

          case 'docs:get-doc-text': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await getBuildDocTextRef.current({
              buildId: activeBuild.id,
              docId: payload?.docId,
              token: docsReadToken
            });
            break;
          }

          case 'docs:search': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await searchBuildDocsRef.current({
              buildId: activeBuild.id,
              query: payload?.query,
              pageToken: payload?.pageToken,
              pageSize: payload?.pageSize,
              token: docsReadToken
            });
            break;
          }

          case 'llm:list-models': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const llmToken = await ensureBuildApiToken(['llm:generate']);
            response = await listBuildLlmModelsRef.current({
              buildId: activeBuild.id,
              token: llmToken
            });
            break;
          }

          case 'llm:generate': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const llmToken = await ensureBuildApiToken(['llm:generate']);
            response = await generateBuildLlmResponseRef.current({
              buildId: activeBuild.id,
              model: payload?.model,
              prompt: payload?.prompt,
              system: payload?.system,
              messages: payload?.messages,
              maxOutputTokens: payload?.maxOutputTokens,
              token: llmToken
            });
            break;
          }

          case 'social:follow': {
            const targetUserId = Number(payload?.userId);
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (!targetUserId || Number.isNaN(targetUserId)) {
              throw new Error('userId is required');
            }
            response = await followBuildUserRef.current({
              buildId: activeBuild.id,
              userId: targetUserId
            });
            break;
          }

          case 'social:unfollow': {
            const targetUserId = Number(payload?.userId);
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (!targetUserId || Number.isNaN(targetUserId)) {
              throw new Error('userId is required');
            }
            response = await unfollowBuildUserRef.current({
              buildId: activeBuild.id,
              userId: targetUserId
            });
            break;
          }

          case 'social:get-followers':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await loadBuildFollowersRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              offset: payload?.offset
            });
            break;

          case 'social:get-following':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await loadBuildFollowingRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              offset: payload?.offset
            });
            break;

          case 'social:is-following': {
            const targetUserId = Number(payload?.userId);
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (!targetUserId || Number.isNaN(targetUserId)) {
              throw new Error('userId is required');
            }
            response = await isFollowingBuildUserRef.current({
              buildId: activeBuild.id,
              userId: targetUserId
            });
            break;
          }

          case 'viewer:get':
            response = { viewer: getViewerInfo() };
            break;

          case 'viewer-db:query':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await queryViewerDbRef.current({
              buildId: activeBuild.id,
              sql: payload?.sql,
              params: payload?.params
            });
            break;

          case 'viewer-db:exec':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await execViewerDbRef.current({
              buildId: activeBuild.id,
              sql: payload?.sql,
              params: payload?.params
            });
            break;

          case 'api:get-user': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const userToken = await ensureBuildApiToken(['user:read']);
            response = await getBuildApiUserRef.current({
              buildId: activeBuild.id,
              userId: payload?.userId,
              token: userToken
            });
            break;
          }

          case 'api:get-users': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const usersToken = await ensureBuildApiToken(['users:read']);
            response = await getBuildApiUsersRef.current({
              buildId: activeBuild.id,
              search: payload?.search,
              userIds: payload?.userIds,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: usersToken
            });
            break;
          }

          case 'api:get-daily-reflections': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const reflectionsToken = await ensureBuildApiToken([
              'dailyReflections:read'
            ]);
            response = await getBuildDailyReflectionsRef.current({
              buildId: activeBuild.id,
              following: payload?.following,
              userIds: payload?.userIds,
              lastId: payload?.lastId,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: reflectionsToken
            });
            break;
          }

          case 'api:get-ai-card-market-trades': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const aiCardsReadToken = await ensureBuildApiToken([
              'aiCards:read'
            ]);
            response = await getBuildAICardMarketTradesRef.current({
              buildId: activeBuild.id,
              cardId: payload?.cardId,
              side: payload?.side,
              since: payload?.since,
              until: payload?.until,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: aiCardsReadToken
            });
            break;
          }

          case 'api:get-ai-card-market-candles': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const aiCardsReadToken = await ensureBuildApiToken([
              'aiCards:read'
            ]);
            response = await getBuildAICardMarketCandlesRef.current({
              buildId: activeBuild.id,
              cardId: payload?.cardId,
              side: payload?.side,
              since: payload?.since,
              until: payload?.until,
              bucketSeconds: payload?.bucketSeconds,
              limit: payload?.limit,
              token: aiCardsReadToken
            });
            break;
          }

          case 'content:my-subjects': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentSubjectsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildMySubjectsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentSubjectsToken
            });
            break;
          }

          case 'content:subject': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentSubjectToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildSubjectRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              token: contentSubjectToken
            });
            break;
          }

          case 'content:subject-comments': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentCommentsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildSubjectCommentsRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentCommentsToken
            });
            break;
          }

          case 'vocabulary:lookup-word': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabLookupToken = await ensureBuildApiToken([
              'vocabulary:read'
            ]);
            response = await lookupBuildVocabularyWordRef.current({
              buildId: activeBuild.id,
              word: payload?.word,
              token: vocabLookupToken
            });
            break;
          }

          case 'vocabulary:collect-word': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabCollectToken = await ensureBuildApiToken([
              'vocabulary:write'
            ]);
            response = await collectBuildVocabularyWordRef.current({
              buildId: activeBuild.id,
              word: payload?.word,
              token: vocabCollectToken
            });
            break;
          }

          case 'vocabulary:break-status': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabBreakToken = await ensureBuildApiToken([
              'vocabulary:read'
            ]);
            response = await getBuildVocabularyBreakStatusRef.current({
              buildId: activeBuild.id,
              token: vocabBreakToken
            });
            break;
          }

          case 'vocabulary:collected-words': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabCollectedToken = await ensureBuildApiToken([
              'vocabulary:read'
            ]);
            response = await getBuildCollectedVocabularyWordsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: vocabCollectedToken
            });
            break;
          }

          case 'shared-db:get-topics': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbTopicsToken = await ensureBuildApiToken([
              'sharedDb:read'
            ]);
            response = await getSharedDbTopicsRef.current({
              buildId: activeBuild.id,
              token: sharedDbTopicsToken
            });
            break;
          }

          case 'shared-db:create-topic': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbCreateTopicToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await createSharedDbTopicRef.current({
              buildId: activeBuild.id,
              name: payload?.name,
              token: sharedDbCreateTopicToken
            });
            break;
          }

          case 'shared-db:get-entries': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbEntriesToken = await ensureBuildApiToken([
              'sharedDb:read'
            ]);
            response = await getSharedDbEntriesRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: sharedDbEntriesToken
            });
            break;
          }

          case 'shared-db:add-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbAddEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await addSharedDbEntryRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              data: payload?.data,
              token: sharedDbAddEntryToken
            });
            break;
          }

          case 'shared-db:update-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbUpdateEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await updateSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              data: payload?.data,
              token: sharedDbUpdateEntryToken
            });
            break;
          }

          case 'shared-db:delete-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbDeleteEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await deleteSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              token: sharedDbDeleteEntryToken
            });
            break;
          }

          case 'private-db:get': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbReadToken = await ensureBuildApiToken([
              'privateDb:read'
            ]);
            response = await getPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbReadToken
            });
            break;
          }

          case 'private-db:list': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbListToken = await ensureBuildApiToken([
              'privateDb:read'
            ]);
            response = await listPrivateDbItemsRef.current({
              buildId: activeBuild.id,
              prefix: payload?.prefix,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: privateDbListToken
            });
            break;
          }

          case 'private-db:set': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbWriteToken = await ensureBuildApiToken([
              'privateDb:write'
            ]);
            response = await setPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              value: payload?.value,
              token: privateDbWriteToken
            });
            break;
          }

          case 'private-db:remove': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbDeleteToken = await ensureBuildApiToken([
              'privateDb:write'
            ]);
            response = await deletePrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbDeleteToken
            });
            break;
          }

          case 'jobs:schedule': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsWriteToken = await ensureBuildApiToken(['jobs:write']);
            response = await scheduleBuildJobRef.current({
              buildId: activeBuild.id,
              name: payload?.name,
              runAt: payload?.runAt,
              intervalSeconds: payload?.intervalSeconds,
              maxRuns: payload?.maxRuns,
              data: payload?.data,
              scope: payload?.scope,
              token: jobsWriteToken
            });
            break;
          }

          case 'jobs:list': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsReadToken = await ensureBuildApiToken(['jobs:read']);
            response = await listBuildJobsRef.current({
              buildId: activeBuild.id,
              scope: payload?.scope,
              status: payload?.status,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: jobsReadToken
            });
            break;
          }

          case 'jobs:cancel': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsCancelToken = await ensureBuildApiToken(['jobs:write']);
            response = await cancelBuildJobRef.current({
              buildId: activeBuild.id,
              jobId: payload?.jobId,
              token: jobsCancelToken
            });
            break;
          }

          case 'jobs:claim-due': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsClaimToken = await ensureBuildApiToken(['jobs:write']);
            response = await claimDueBuildJobsRef.current({
              buildId: activeBuild.id,
              scope: payload?.scope,
              limit: payload?.limit,
              token: jobsClaimToken
            });
            break;
          }

          case 'mail:send': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const mailSendToken = await ensureBuildApiToken(['mail:send']);
            response = await sendBuildMailRef.current({
              buildId: activeBuild.id,
              to: payload?.to,
              subject: payload?.subject,
              text: payload?.text,
              html: payload?.html,
              from: payload?.from,
              replyTo: payload?.replyTo,
              meta: payload?.meta,
              token: mailSendToken
            });
            break;
          }

          case 'mail:list': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const mailReadToken = await ensureBuildApiToken(['mail:read']);
            response = await listBuildMailRef.current({
              buildId: activeBuild.id,
              status: payload?.status,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: mailReadToken
            });
            break;
          }

          default:
            throw new Error(`Unknown request type: ${type}`);
        }

        // SECURITY: Use '*' because blob URLs have null origins.
        // Security is enforced by validating event.source above.
        sourceWindow.postMessage(
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
        sourceWindow.postMessage(
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={panelClass}>
      <div className={toolbarClass}>
        <div className={toolbarTitleClass}>
          <Icon icon="laptop-code" />
          Workspace
        </div>
        <div className={toolbarActionsClass}>
          {isOwner && (
            <GameCTAButton
              variant="purple"
              size="md"
              icon="clock"
              onClick={() => setHistoryOpen(true)}
            >
              History
            </GameCTAButton>
          )}
          <SegmentedToggle<'preview' | 'code'>
            value={viewMode}
            onChange={setViewMode}
            options={workspaceViewOptions}
            size="md"
            ariaLabel="Workspace mode"
          />
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
          code &&
          (previewFrameSources.primary ||
            previewFrameSources.secondary ||
            previewSrc) ? (
            <div className={previewStageClass}>
              {!previewFrameReady[activePreviewFrame] && (
                <div className={previewPreloadSurfaceClass}>
                  <div className={previewPreloadIconWrapClass}>
                    <Icon icon="spinner" className={previewSpinnerClass} />
                  </div>
                  <div className={previewPreloadLabelClass}>Loading...</div>
                </div>
              )}
              {previewFrameSources.primary && (
                <iframe
                  ref={primaryIframeRef}
                  src={previewFrameSources.primary}
                  title="Preview (primary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'primary',
                      previewFrameSources.primary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewFrameSources.secondary && (
                <iframe
                  ref={secondaryIframeRef}
                  src={previewFrameSources.secondary}
                  title="Preview (secondary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'secondary',
                      previewFrameSources.secondary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewTransitioning && (
                <div className={previewLoadingOverlayClass}>
                  <Icon icon="spinner" className={previewSpinnerClass} />
                  Updating preview
                </div>
              )}
            </div>
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
                No versions yet. Ask Copilot to generate or review code to
                create version history.
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
                  <GameCTAButton
                    variant="orange"
                    size="sm"
                    onClick={() => handleRestoreVersion(version.id)}
                    disabled={restoringVersionId === version.id}
                    loading={restoringVersionId === version.id}
                  >
                    {restoringVersionId === version.id
                      ? 'Restoring...'
                      : 'Restore'}
                  </GameCTAButton>
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
