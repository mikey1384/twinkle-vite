import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

interface Build {
  id: number;
  title: string;
  username: string;
}

interface PreviewPanelProps {
  build: Build;
  code: string | null;
  isOwner: boolean;
  onCodeChange: (code: string) => void;
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

export default function PreviewPanel({
  build,
  code,
  isOwner,
  onCodeChange
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const downloadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.downloadBuildDatabase
  );
  const uploadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.uploadBuildDatabase
  );

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

  // Handle postMessage from iframe
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'twinkle-build') return;

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      // Verify message came from our iframe
      if (event.source !== iframe.contentWindow) return;

      const { id, type, payload } = data;

      try {
        let response: any = {};

        switch (type) {
          case 'init':
            response = {
              id: build.id,
              title: build.title,
              username: build.username
            };
            break;

          case 'db:load':
            if (!isOwner) {
              throw new Error('Not authorized');
            }
            const dbData = await downloadBuildDatabase(build.id);
            if (dbData) {
              // Convert ArrayBuffer to base64
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
            if (!isOwner) {
              throw new Error('Not authorized');
            }
            // Convert base64 to ArrayBuffer
            const base64 = payload.data;
            const binaryStr = atob(base64);
            const len = binaryStr.length;
            const bytesArr = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytesArr[i] = binaryStr.charCodeAt(i);
            }
            const result = await uploadBuildDatabase({
              buildId: build.id,
              data: bytesArr.buffer
            });
            response = result;
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
    },
    [build, isOwner, downloadBuildDatabase, uploadBuildDatabase]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        flex-direction: column;
        background: ${Color.wellGray()};
        @media (max-width: ${mobileMaxWidth}) {
          height: 50%;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          padding: 0.5rem 1rem;
          background: #fff;
          border-bottom: 1px solid ${Color.borderGray()};
          gap: 0.5rem;
        `}
      >
        <button
          onClick={() => setViewMode('preview')}
          className={css`
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            background: ${viewMode === 'preview'
              ? Color.logoBlue()
              : 'transparent'};
            color: ${viewMode === 'preview' ? '#fff' : Color.darkGray()};
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.2s;
            &:hover {
              background: ${viewMode === 'preview'
                ? Color.logoBlue()
                : Color.wellGray()};
            }
          `}
        >
          <Icon icon="eye" style={{ marginRight: '0.5rem' }} />
          Preview
        </button>
        <button
          onClick={() => setViewMode('code')}
          className={css`
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            background: ${viewMode === 'code'
              ? Color.logoBlue()
              : 'transparent'};
            color: ${viewMode === 'code' ? '#fff' : Color.darkGray()};
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.2s;
            &:hover {
              background: ${viewMode === 'code'
                ? Color.logoBlue()
                : Color.wellGray()};
            }
          `}
        >
          <Icon icon="code" style={{ marginRight: '0.5rem' }} />
          Code
        </button>
      </div>

      <div
        className={css`
          flex: 1;
          overflow: hidden;
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
                color: ${Color.darkGray()};
                text-align: center;
                padding: 2rem;
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.5 }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                No preview available yet
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem',
                  color: Color.gray()
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
                  color: ${Color.darkGray()};
                `}
              >
                No code yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
