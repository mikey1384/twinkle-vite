import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TopicRequestStatus from '../../TopicRequestStatus';
import { useAppContext } from '~/contexts';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  describeTopicBrainSource,
  type TopicBrain,
  type TopicBrainVersion,
  type TopicBrainVersionSummary
} from '~/helpers/topicBrain';
import { chatTopicButtonStyle, chatTopicModalClass } from '../../topicStyles';
import { topicSettingsHelpClass, topicSettingsLabelClass } from '../styles';
import BrainDiff from './BrainDiff';

// Every saved version of this topic's instructions and notes: who changed
// it and when. Opening one shows what going back to it would change;
// Restore saves it as the newest version (history is never rewritten).
export default function HistoryModal({
  brain,
  themeColor,
  onHide,
  onRestored
}: {
  brain: TopicBrain;
  themeColor: string;
  onHide: () => void;
  onRestored: (brain: TopicBrain) => void;
}) {
  const loadTopicBrainVersions = useAppContext(
    (v) => v.requestHelpers.loadTopicBrainVersions
  );
  const loadTopicBrainVersion = useAppContext(
    (v) => v.requestHelpers.loadTopicBrainVersion
  );
  const restoreTopicBrainVersion = useAppContext(
    (v) => v.requestHelpers.restoreTopicBrainVersion
  );
  const [versions, setVersions] = useState<TopicBrainVersionSummary[] | null>(
    null
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [opened, setOpened] = useState<TopicBrainVersion | null>(null);
  const [openFailed, setOpenFailed] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const restoringRef = useRef(false);
  const { channelId, topicId } = brain;

  useEffect(() => {
    let ignore = false;
    setLoadFailed(false);
    loadTopicBrainVersions({ channelId, topicId })
      .then((data: { versions: TopicBrainVersionSummary[] }) => {
        if (!ignore) setVersions(data?.versions || []);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!ignore) setLoadFailed(true);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, topicId, attempt, brain.revision]);

  useEffect(() => {
    if (!openId) return;
    let ignore = false;
    setOpened(null);
    setOpenFailed(false);
    loadTopicBrainVersion({ channelId, topicId, versionId: openId })
      .then((data: { version: TopicBrainVersion }) => {
        if (!ignore) setOpened(data?.version || null);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!ignore) setOpenFailed(true);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const newestRevision = versions?.[0]?.revision;

  return (
    <Modal
      modalKey="TopicBrainHistory"
      isOpen
      onClose={handleClose}
      size="md"
      modalLevel={3}
      title="History"
      aria-label="Topic brain history"
      className={chatTopicModalClass}
      style={{ width: 'min(640px, calc(100vw - 24px))', maxWidth: '100%' }}
      bodyPadding="12px"
      footer={
        <Button variant="ghost" disabled={restoring} onClick={handleClose}>
          Close
        </Button>
      }
    >
      <div style={{ width: '100%' }}>
        {loadFailed ? (
          <TopicRequestStatus
            message="Couldn't load the history. Please try again."
            onRetry={() => setAttempt((value) => value + 1)}
          />
        ) : !versions ? (
          <p style={{ textAlign: 'center', color: '#526176' }}>
            <Icon icon="spinner" pulse /> Loading…
          </p>
        ) : !versions.length ? (
          <p style={{ margin: 0, color: '#526176' }}>
            Nothing has been saved yet. Every change you or{' '}
            {brain.assistantName} make shows up here, and you can always go
            back.
          </p>
        ) : (
          <ul className={listCls}>
            {versions.map((version) => {
              const isNow = version.revision === newestRevision;
              const isOpen = openId === version.id;
              return (
                <li key={version.id}>
                  <button
                    type="button"
                    className={rowCls}
                    aria-expanded={isOpen}
                    disabled={restoring}
                    onClick={() => {
                      setError('');
                      setOpenId(isOpen ? null : version.id);
                    }}
                  >
                    <Icon icon={isOpen ? 'chevron-down' : 'chevron-right'} />
                    <span className="who">
                      <b>{describeTopicBrainSource(version)}</b>
                      {isNow && <em>Now</em>}
                      {version.summary && <small>{version.summary}</small>}
                    </span>
                    <time>{timeSince(version.createdAt)}</time>
                  </button>
                  {isOpen && (
                    <div className={detailCls}>
                      {openFailed ? (
                        <p className={topicSettingsHelpClass} data-error="true">
                          Couldn’t open this version. Tap it again to retry.
                        </p>
                      ) : !opened ? (
                        <p style={{ margin: 0, color: '#526176' }}>
                          <Icon icon="spinner" pulse /> Loading…
                        </p>
                      ) : isNow ? (
                        <>
                          <VersionText
                            label="Custom Instructions"
                            before={opened.instructions}
                            after={opened.instructions}
                          />
                          <VersionText
                            label="Notes for next time"
                            before={opened.notes}
                            after={opened.notes}
                          />
                        </>
                      ) : (
                        <>
                          <p className={topicSettingsHelpClass} style={{ marginTop: 0 }}>
                            Going back to this version would change:
                          </p>
                          <VersionText
                            label="Custom Instructions"
                            before={brain.instructions}
                            after={opened.instructions}
                          />
                          <VersionText
                            label="Notes for next time"
                            before={brain.notes}
                            after={opened.notes}
                          />
                          {error && (
                            <p role="alert" className={topicSettingsHelpClass} data-error="true">
                              {error}
                            </p>
                          )}
                          <Button
                            color={themeColor}
                            style={{
                              ...chatTopicButtonStyle(themeColor),
                              marginTop: 12,
                              minHeight: 44,
                              fontSize: 'calc(16 * var(--px))'
                            }}
                            uppercase={false}
                            loading={restoring}
                            disabled={
                              restoring ||
                              (opened.instructions === brain.instructions &&
                                opened.notes === brain.notes)
                            }
                            onClick={() => handleRestore(opened)}
                          >
                            Restore this version
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );

  function handleClose() {
    if (!restoringRef.current) onHide();
  }

  async function handleRestore(version: TopicBrainVersion) {
    if (restoringRef.current) return;
    restoringRef.current = true;
    setRestoring(true);
    setError('');
    try {
      const { brain: restored } = await restoreTopicBrainVersion({
        channelId,
        topicId,
        versionId: version.id,
        baseRevision: brain.revision
      });
      onRestored(restored);
      setOpenId(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Couldn't restore this version. Please try again.");
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  }
}

function VersionText({
  label,
  before,
  after
}: {
  label: string;
  before: string;
  after: string;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <span className={topicSettingsLabelClass}>{label}</span>
      {before === after && !after ? (
        <p style={{ margin: 0, color: '#526176', fontSize: 'calc(14 * var(--px))' }}>
          Empty
        </p>
      ) : (
        <BrainDiff before={before} after={after} />
      )}
    </div>
  );
}

const listCls = css`
  list-style: none;
  margin: 0;
  padding: 0;
  > li + li {
    border-top: 1px solid #e9edf2;
  }
`;

const rowCls = css`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 8px 4px;
  border: 0;
  background: transparent;
  color: #273449;
  font: inherit;
  text-align: left;
  cursor: pointer;
  .who {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    min-width: 0;
  }
  b {
    font-size: calc(16 * var(--px));
  }
  em {
    padding: 0 8px;
    border-radius: 999px;
    background: #e7f6ec;
    color: #14532d;
    font-size: calc(13 * var(--px));
    font-style: normal;
    font-weight: 700;
  }
  small {
    flex-basis: 100%;
    color: #526176;
    font-size: calc(14 * var(--px));
    overflow-wrap: anywhere;
  }
  time {
    flex: 0 0 auto;
    color: #526176;
    font-size: calc(13 * var(--px));
  }
  &:hover:not(:disabled) {
    background: #f7f9fc;
  }
`;

const detailCls = css`
  padding: 0 4px 14px 28px;
`;
