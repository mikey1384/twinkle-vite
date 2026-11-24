import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import type { EditableProjectFile } from '../types';
import {
  diffLines,
  diffStats,
  foldRows,
  freshLineNumbers,
  languageForPath,
  type LiveRow
} from './liveDiff';
import { sliceTokens, tokenizeLines, VSCODE, type LiveToken } from './highlight';

// Lumine's edits as they land, dressed like VS Code (Mikey 11-24): tabs for
// the changed files, a breadcrumb, two line-number columns, gutter bars for
// added / modified / removed lines, an inline green/red diff with Dark Modern
// syntax colours, a cursor that types the new lines out, an overview ruler
// and the blue status bar. Streamed files arrive a whole edit at a time, so
// the cursor replays each new edit quickly (a few seconds at most) and then
// shows the real file exactly. Reduced motion shows edits at once.

const MONO = "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const MIN_REPLAY_MS = 900;
const MAX_REPLAY_MS = 3200;

interface Replay {
  path: string;
  target: string;
  fresh: number[];
  lengths: number[];
  total: number;
  startedAt: number;
  duration: number;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function fileName(path: string) {
  return path.split('/').filter(Boolean).pop() || path;
}

export default function LiveCodeEditor({
  files,
  persistedFileContentByPath,
  activeFilePath,
  following,
  onSelectFile
}: {
  files: EditableProjectFile[];
  persistedFileContentByPath: Map<string, string>;
  activeFilePath: string;
  following: boolean;
  onSelectFile: (path: string) => void;
}) {
  const activeFile =
    files.find((file) => file.path === activeFilePath) || files[0] || null;
  const path = activeFile?.path || activeFilePath;
  const target = activeFile?.content || '';
  const saved = persistedFileContentByPath.get(path) ?? '';
  const isNewFile = !persistedFileContentByPath.has(path);
  const language = languageForPath(path);
  const [reduced] = useState(prefersReducedMotion);
  const [expandedFolds, setExpandedFolds] = useState<Set<string>>(
    () => new Set()
  );
  const shownRef = useRef(new Map<string, string>());
  const [replay, setReplay] = useState<Replay | null>(null);
  const [typedChars, setTypedChars] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const caretRowRef = useRef<HTMLDivElement | null>(null);
  const firstChangeRef = useRef<HTMLDivElement | null>(null);

  const changedFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          !persistedFileContentByPath.has(file.path) ||
          persistedFileContentByPath.get(file.path) !== file.content
      ),
    [files, persistedFileContentByPath]
  );
  const tabs = useMemo(() => {
    const list = [...changedFiles];
    if (activeFile && !list.some((file) => file.path === activeFile.path)) {
      list.unshift(activeFile);
    }
    return list;
  }, [activeFile, changedFiles]);

  // A new version of the open file: type out the lines it brought.
  useEffect(() => {
    const shown = shownRef.current;
    if (!shown.has(path)) {
      // First look at this file: show it as it is.
      shown.set(path, target);
      setReplay(null);
      return;
    }
    const previous = shown.get(path) as string;
    if (previous === target) return;
    shown.set(path, target);
    if (reduced) {
      setReplay(null);
      return;
    }
    const fresh = freshLineNumbers(previous, target);
    const lines = target.split('\n');
    const lengths = fresh.map((lineNo) => (lines[lineNo - 1] || '').length);
    const total = lengths.reduce((sum, n) => sum + n, 0);
    if (!total) {
      setReplay(null);
      return;
    }
    setTypedChars(0);
    setReplay({
      path,
      target,
      fresh,
      lengths,
      total,
      startedAt: performance.now(),
      duration: Math.max(MIN_REPLAY_MS, Math.min(MAX_REPLAY_MS, total * 2.2))
    });
  }, [path, target, reduced]);

  useEffect(() => {
    if (!replay) return;
    let frame = 0;
    let last = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - replay.startedAt) / replay.duration);
      if (now - last > 33 || progress >= 1) {
        last = now;
        setTypedChars(Math.round(progress * replay.total));
      }
      if (progress >= 1) {
        setReplay(null);
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [replay]);

  const rows = useMemo(() => diffLines(saved, target), [saved, target]);
  const stats = useMemo(() => diffStats(rows), [rows]);
  const items = useMemo(
    () => foldRows(rows, { expanded: expandedFolds }),
    [rows, expandedFolds]
  );
  const newTokens = useMemo(
    () => tokenizeLines(target, language.prism),
    [target, language.prism]
  );
  const oldTokens = useMemo(
    () => tokenizeLines(saved, language.prism),
    [saved, language.prism]
  );

  // Where the cursor is in the replay: lines before it are typed, the line it
  // is on is partly typed, later fresh lines are not on screen yet.
  const activeReplay = replay && replay.path === path && replay.target === target ? replay : null;
  let typingLine: number | null = null;
  let typingChars = 0;
  const hiddenLines = new Set<number>();
  if (activeReplay) {
    let left = typedChars;
    for (let index = 0; index < activeReplay.fresh.length; index++) {
      const lineNo = activeReplay.fresh[index];
      const length = activeReplay.lengths[index];
      if (typingLine !== null) {
        hiddenLines.add(lineNo);
      } else if (left >= length) {
        left -= length;
      } else {
        typingLine = lineNo;
        typingChars = left;
      }
    }
  }

  const firstChangedNewNo = useMemo(() => {
    const row = rows.find((r) => r.kind !== 'context');
    return row ? row.newNo ?? row.oldNo : null;
  }, [rows]);
  const cursorLine = typingLine ?? firstChangedNewNo ?? 1;
  const cursorCol =
    typingLine !== null
      ? typingChars + 1
      : (target.split('\n')[cursorLine - 1] || '').length + 1;

  // Keep the cursor in view while following Lumine (the editor scrolls, never
  // the page).
  useLayoutEffect(() => {
    if (!following) return;
    const container = scrollRef.current;
    const row = caretRowRef.current || firstChangeRef.current;
    if (!container || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    if (top < viewTop + 24 || bottom > viewBottom - 24) {
      container.scrollTop = Math.max(0, top - container.clientHeight * 0.4);
    }
  }, [following, typingLine, path, firstChangedNewNo]);

  const visibleItems = items.filter(
    (item) => item.kind === 'fold' || item.kind !== 'added' || !hiddenLines.has(item.newNo as number)
  );
  const totalRows = visibleItems.length || 1;
  const segments = path.split('/').filter(Boolean);
  let firstChangeMarked = false;

  return (
    <div className={rootCls} data-testid="build-live-code">
      <div className={tabBarCls} role="tablist" aria-label="Files Lumine is changing">
        {tabs.map((file) => {
          const active = file.path === path;
          const fileLanguage = languageForPath(file.path);
          const added = !persistedFileContentByPath.has(file.path);
          const changed = !added && persistedFileContentByPath.get(file.path) !== file.content;
          const writing = active && following;
          return (
            <button
              key={file.path}
              type="button"
              role="tab"
              aria-selected={active}
              className={cx(tabCls, active && tabActiveCls)}
              onClick={() => onSelectFile(file.path)}
              title={file.path}
            >
              <span className={badgeCls} style={{ color: fileLanguage.color }}>
                {fileLanguage.badge}
              </span>
              <span
                className={tabNameCls}
                style={{
                  color: added ? VSCODE.gitAdded : changed ? VSCODE.gitModified : undefined
                }}
              >
                {fileName(file.path)}
              </span>
              {added || changed ? (
                <span
                  className={gitLetterCls}
                  style={{ color: added ? VSCODE.gitAdded : VSCODE.gitModified }}
                >
                  {added ? 'U' : 'M'}
                </span>
              ) : null}
              <span className={cx(tabDotCls, writing && tabDotLiveCls)} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className={breadcrumbCls}>
        {segments.map((segment, index) => (
          <React.Fragment key={`${segment}-${index}`}>
            {index > 0 ? <span className={crumbSepCls}>›</span> : null}
            {index === segments.length - 1 ? (
              <span className={badgeCls} style={{ color: language.color }}>
                {language.badge}
              </span>
            ) : null}
            <span>{segment}</span>
          </React.Fragment>
        ))}
      </div>
      <div className={editorWrapCls}>
        <div ref={scrollRef} className={editorCls} aria-label={`Live changes in ${path}`}>
          {visibleItems.map((item) => {
            if (item.kind === 'fold') {
              return (
                <button
                  key={item.key}
                  type="button"
                  className={foldCls}
                  onClick={() =>
                    setExpandedFolds((prev) => new Set(prev).add(item.key))
                  }
                >
                  ⋯ {item.count} unchanged lines
                </button>
              );
            }
            const row = item as LiveRow;
            const isTyping = row.kind === 'added' && row.newNo === typingLine;
            const tokens =
              row.kind === 'removed'
                ? oldTokens[(row.oldNo || 1) - 1]
                : newTokens[(row.newNo || 1) - 1];
            const markFirst = !firstChangeMarked && row.kind !== 'context';
            if (markFirst) firstChangeMarked = true;
            return (
              <CodeRow
                key={`${row.kind}-${row.oldNo}-${row.newNo}`}
                rowRef={isTyping ? caretRowRef : markFirst ? firstChangeRef : undefined}
                row={row}
                tokens={tokens || EMPTY_TOKENS}
                typedChars={isTyping ? typingChars : null}
                cursorHere={!activeReplay && row.newNo === cursorLine && row.kind !== 'removed'}
              />
            );
          })}
        </div>
        <div className={rulerCls} aria-hidden="true">
          {visibleItems.map((item, index) =>
            item.kind === 'added' || item.kind === 'removed' ? (
              <span
                key={index}
                style={{
                  top: `${(index / totalRows) * 100}%`,
                  background:
                    item.kind === 'removed'
                      ? VSCODE.removedGutter
                      : (item as LiveRow).modified
                        ? VSCODE.modifiedGutter
                        : VSCODE.addedGutter
                }}
              />
            ) : null
          )}
        </div>
      </div>
      <div className={statusBarCls} role="status" aria-live="polite">
        <span className={statusItemCls}>
          <span className={statusPulseCls} aria-hidden="true" />
          {activeReplay || following ? 'Lumine is editing' : 'Lumine’s changes'}
        </span>
        <span className={statusItemCls}>
          <span style={{ color: '#b5f0c0' }}>+{stats.added}</span>
          <span style={{ color: '#ffc9c6' }}>−{stats.removed}</span>
          {isNewFile ? <span>new file</span> : null}
        </span>
        <span className={statusSpacerCls} />
        <span className={cx(statusItemCls, statusWideCls)}>
          Ln {cursorLine}, Col {cursorCol}
        </span>
        <span className={cx(statusItemCls, statusWideCls)}>UTF-8</span>
        <span className={statusItemCls}>{language.label}</span>
      </div>
    </div>
  );
}

const EMPTY_TOKENS: LiveToken[] = [];

const CodeRow = memo(function CodeRow({
  row,
  tokens,
  typedChars,
  cursorHere,
  rowRef
}: {
  row: LiveRow;
  tokens: LiveToken[];
  typedChars: number | null;
  cursorHere: boolean;
  rowRef?: React.Ref<HTMLDivElement>;
}) {
  const shown = typedChars === null ? tokens : sliceTokens(tokens, typedChars);
  const typing = typedChars !== null;
  return (
    <div
      ref={rowRef}
      className={cx(
        rowCls,
        row.kind === 'added' && rowAddedCls,
        row.kind === 'removed' && rowRemovedCls,
        (typing || cursorHere) && rowCurrentCls
      )}
      data-kind={row.kind}
    >
      <span className={cx(numCls, numOldCls)}>{row.oldNo ?? ''}</span>
      <span
        className={cx(numCls, numNewCls, (typing || cursorHere) && numActiveCls)}
      >
        {row.newNo ?? ''}
      </span>
      <span
        className={markerCls}
        style={{
          background:
            row.kind === 'removed'
              ? VSCODE.removedGutter
              : row.kind === 'added'
                ? row.modified
                  ? VSCODE.modifiedGutter
                  : VSCODE.addedGutter
                : 'transparent'
        }}
      />
      <span className={cx(codeCls, row.kind === 'removed' && codeRemovedCls)}>
        {shown.length === 0 && !typing ? ' ' : null}
        {shown.map((token, index) => (
          <span key={index} style={{ color: token.color }}>
            {token.text}
          </span>
        ))}
        {typing ? <span className={caretCls} aria-hidden="true" /> : null}
        {cursorHere && !typing ? (
          <span className={cx(caretCls, caretBlinkCls)} aria-hidden="true" />
        ) : null}
      </span>
    </div>
  );
});

const rootCls = css`
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  background: ${VSCODE.editorBg};
  color: ${VSCODE.editorFg};
  font-family: ${MONO};
`;

const tabBarCls = css`
  display: flex;
  overflow-x: auto;
  background: ${VSCODE.tabBarBg};
  border-bottom: 1px solid ${VSCODE.border};
  scrollbar-width: thin;
`;

const tabCls = css`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  max-width: 22rem;
  padding: 0.75rem 1rem 0.7rem;
  border: none;
  border-right: 1px solid ${VSCODE.border};
  background: ${VSCODE.tabBg};
  color: ${VSCODE.tabFg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.25rem;
  cursor: pointer;
  &:hover {
    background: #1f1f1f;
  }
`;

const tabActiveCls = css`
  background: ${VSCODE.tabActiveBg};
  color: ${VSCODE.tabActiveFg};
  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 2px;
    background: ${VSCODE.tabActiveTop};
  }
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: ${VSCODE.tabActiveBg};
  }
`;

const badgeCls = css`
  font-family: ${MONO};
  font-size: 1.1rem;
  font-weight: 800;
  flex-shrink: 0;
`;

const tabNameCls = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const gitLetterCls = css`
  font-size: 1.1rem;
  font-weight: 700;
`;

const tabDotCls = css`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.75;
  flex-shrink: 0;
`;

const tabDotLiveCls = css`
  background: ${VSCODE.gitAdded};
  opacity: 1;
  animation: live-tab-dot 1.2s ease-in-out infinite;
  @keyframes live-tab-dot {
    50% {
      opacity: 0.3;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const breadcrumbCls = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.35rem 1.2rem;
  overflow: hidden;
  white-space: nowrap;
  color: ${VSCODE.breadcrumbFg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.15rem;
  border-bottom: 1px solid ${VSCODE.border};
`;

const crumbSepCls = css`
  opacity: 0.6;
`;

const editorWrapCls = css`
  position: relative;
  min-height: 0;
  display: flex;
`;

const editorCls = css`
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 0.4rem 0 2rem;
  font-size: 1.3rem;
  line-height: 1.6;
  @media (max-width: 640px) {
    font-size: 1.2rem;
  }
`;

const rulerCls = css`
  position: relative;
  width: 1.1rem;
  flex-shrink: 0;
  border-left: 1px solid ${VSCODE.border};
  span {
    position: absolute;
    left: 0.25rem;
    right: 0.25rem;
    height: 3px;
  }
`;

const rowCls = css`
  display: flex;
  align-items: stretch;
  min-width: max-content;
  white-space: pre;
`;

const rowAddedCls = css`
  --row-tint: ${VSCODE.addedBg};
  background: ${VSCODE.addedBg};
`;

const rowRemovedCls = css`
  --row-tint: ${VSCODE.removedBg};
  background: ${VSCODE.removedBg};
`;

const rowCurrentCls = css`
  box-shadow:
    inset 0 1px 0 #303030,
    inset 0 -1px 0 #303030;
`;

const numCls = css`
  position: sticky;
  left: 0;
  width: 4.2rem;
  flex-shrink: 0;
  padding-right: 0.6rem;
  text-align: right;
  color: ${VSCODE.gutterFg};
  background: ${VSCODE.editorBg};
  box-shadow: inset 0 0 0 999px var(--row-tint, transparent);
  user-select: none;
`;

const numOldCls = css`
  @media (max-width: 640px) {
    display: none;
  }
`;

const numNewCls = css`
  left: 4.2rem;
  @media (max-width: 640px) {
    left: 0;
  }
`;

const numActiveCls = css`
  color: ${VSCODE.gutterActiveFg};
`;

const markerCls = css`
  width: 3px;
  flex-shrink: 0;
  margin-right: 1.2rem;
`;

const codeCls = css`
  padding-right: 2rem;
`;

const codeRemovedCls = css`
  opacity: 0.85;
`;

const caretCls = css`
  display: inline-block;
  width: 2px;
  height: 1.25em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: ${VSCODE.cursor};
`;

const caretBlinkCls = css`
  animation: live-caret 1.06s steps(1) infinite;
  @keyframes live-caret {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const foldCls = css`
  display: block;
  width: 100%;
  margin: 0.15rem 0;
  padding: 0.15rem 0 0.15rem 9.6rem;
  border: none;
  background: ${VSCODE.foldBg};
  color: ${VSCODE.foldFg};
  font-family: ${MONO};
  font-size: 1.15rem;
  text-align: left;
  cursor: pointer;
  &:hover {
    color: #ffffff;
  }
  @media (max-width: 640px) {
    padding-left: 5.4rem;
  }
`;

const statusBarCls = css`
  display: flex;
  align-items: center;
  gap: 1.4rem;
  min-width: 0;
  padding: 0.3rem 1rem;
  background: ${VSCODE.statusBg};
  color: ${VSCODE.statusFg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.15rem;
  white-space: nowrap;
  overflow: hidden;
`;

const statusItemCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;

const statusWideCls = css`
  @media (max-width: 640px) {
    display: none;
  }
`;

const statusSpacerCls = css`
  flex: 1;
`;

const statusPulseCls = css`
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #ffffff;
  animation: live-status-pulse 1.2s ease-in-out infinite;
  @keyframes live-status-pulse {
    50% {
      opacity: 0.35;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

