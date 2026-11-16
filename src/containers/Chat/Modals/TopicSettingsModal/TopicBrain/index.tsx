import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';
import {
  TOPIC_BRAIN_FILE_ACCEPT,
  TOPIC_BRAIN_UPLOAD_MAX_BYTES,
  downloadTextFile,
  readFileAsBase64,
  type TopicBrain as TopicBrainData
} from '~/helpers/topicBrain';
import { chatTopicActionStyle } from '../../topicStyles';
import {
  topicSettingsActionsClass,
  topicSettingsHelpClass,
  topicSettingsLabelClass,
  topicSettingsSectionClass
} from '../styles';
import HistoryModal from './HistoryModal';
import ImportFileModal, { type ImportChoice } from './ImportFileModal';
import NotesEditorModal from './NotesEditorModal';

interface PickedFile {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}

// The topic brain in Topic Settings (Zero/Ciel topics): what the assistant
// keeps in mind every time the member chats here, all of it visible and
// theirs to change: notes for next time, kept files, the history, and a
// download. Each action saves on its own and shows what the server answers;
// Custom Instructions above keep saving with the window's Save button.
export default function TopicBrain({
  channelId,
  topicId,
  assistantName,
  themeColor,
  disabled = false,
  onUseAsInstructions,
  onInstructionsChanged
}: {
  channelId: number;
  topicId: number;
  assistantName: string;
  themeColor: string;
  disabled?: boolean;
  // a file's words go into the Custom Instructions box (saved with Save)
  onUseAsInstructions: (text: string) => void;
  // a restored version changed the saved Custom Instructions
  onInstructionsChanged: (instructions: string) => void;
}) {
  const loadTopicBrain = useAppContext((v) => v.requestHelpers.loadTopicBrain);
  const addTopicBrainFile = useAppContext(
    (v) => v.requestHelpers.addTopicBrainFile
  );
  const readTopicBrainFile = useAppContext(
    (v) => v.requestHelpers.readTopicBrainFile
  );
  const deleteTopicBrainFile = useAppContext(
    (v) => v.requestHelpers.deleteTopicBrainFile
  );
  const exportTopicBrain = useAppContext(
    (v) => v.requestHelpers.exportTopicBrain
  );
  const [brain, setBrain] = useState<TopicBrainData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [busyChoice, setBusyChoice] = useState<ImportChoice | null>(null);
  const [importError, setImportError] = useState('');
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [notesFromFile, setNotesFromFile] = useState(false);
  const [historyShown, setHistoryShown] = useState(false);
  const [busy, setBusy] = useState<'download' | number | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    setLoadFailed(false);
    loadTopicBrain({ channelId, topicId })
      .then((data: { brain: TopicBrainData }) => {
        if (!ignore) setBrain(data?.brain || null);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!ignore) setLoadFailed(true);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, topicId, attempt]);

  const name = brain?.assistantName || assistantName;
  const controlsDisabled = disabled || !brain || busy !== null;
  const hasAnything =
    !!brain && (!!brain.notes || !!brain.instructions || brain.files.length > 0);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TopicSettingsModal/TopicBrain">
      <div className={topicSettingsSectionClass}>
        <span className={headingCls}>
          <Icon icon="brain" /> Topic Brain
        </span>
        <p className={topicSettingsHelpClass} style={{ marginTop: 4 }}>
          What {name} keeps in mind every time you chat here. You can see and
          change all of it.
        </p>

        {loadFailed ? (
          <p className={topicSettingsHelpClass} data-error="true" role="alert">
            Couldn’t load this.{' '}
            <Button
              variant="ghost"
              uppercase={false}
              style={chatTopicActionStyle}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Try again
            </Button>
          </p>
        ) : !brain ? (
          <p style={{ color: '#526176' }}>
            <Icon icon="spinner" pulse /> Loading…
          </p>
        ) : (
          <>
            <div className={blockCls}>
              <div className={blockHeadCls}>
                <span className={topicSettingsLabelClass} style={{ margin: 0 }}>
                  Notes for next time
                </span>
                <Button
                  variant="ghost"
                  uppercase={false}
                  style={chatTopicActionStyle}
                  disabled={controlsDisabled}
                  onClick={() => {
                    setStatus('');
                    setNotesFromFile(false);
                    setNotesDraft(brain.notes);
                  }}
                >
                  <Icon icon="pencil-alt" style={{ marginRight: 6 }} />
                  {brain.notes ? 'Edit' : 'Write notes'}
                </Button>
              </div>
              {brain.notes ? (
                <p className={notesPreviewCls}>{brain.notes}</p>
              ) : (
                <p className={emptyCls}>
                  Where you got to, what’s next, things to remember. You can
                  write them, or ask {name} to “save where we are”.
                </p>
              )}
            </div>

            <div className={blockCls}>
              <div className={blockHeadCls}>
                <span className={topicSettingsLabelClass} style={{ margin: 0 }}>
                  Files {name} keeps reading
                </span>
                <Button
                  variant="ghost"
                  uppercase={false}
                  style={chatTopicActionStyle}
                  disabled={controlsDisabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon icon="plus" style={{ marginRight: 6 }} />
                  Add a file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={TOPIC_BRAIN_FILE_ACCEPT}
                  style={{ display: 'none' }}
                  onChange={handlePickFile}
                />
              </div>
              {brain.files.length ? (
                <ul className={filesCls}>
                  {brain.files.map((file) => (
                    <li key={file.id}>
                      <Icon icon="paperclip" />
                      <span>{file.fileName}</span>
                      <button
                        type="button"
                        disabled={controlsDisabled}
                        onClick={() => handleRemoveFile(file.id)}
                        aria-label={`Take out ${file.fileName}`}
                        title="Take this file out"
                      >
                        <Icon
                          icon={busy === file.id ? 'spinner' : 'times'}
                          pulse={busy === file.id}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={emptyCls}>
                  A handoff file from another AI tool, a study plan, a story
                  outline. Text, Markdown, PDF or Word.
                </p>
              )}
            </div>

            {(error || status) && (
              <p
                role={error ? 'alert' : 'status'}
                className={topicSettingsHelpClass}
                data-error={!!error}
              >
                {error || status}
              </p>
            )}

            <div className={topicSettingsActionsClass} style={{ marginTop: 12 }}>
              <Button
                variant="ghost"
                color="darkerGray"
                style={chatTopicActionStyle}
                disabled={controlsDisabled}
                onClick={() => setHistoryShown(true)}
              >
                <Icon icon="history" style={{ marginRight: 6 }} />
                History
              </Button>
              <Button
                variant="ghost"
                color="darkerGray"
                style={chatTopicActionStyle}
                disabled={controlsDisabled || !hasAnything}
                loading={busy === 'download'}
                onClick={handleDownload}
              >
                <Icon icon="download" style={{ marginRight: 6 }} />
                Download
              </Button>
            </div>
          </>
        )}
      </div>

      {picked && brain && (
        <ImportFileModal
          fileName={picked.fileName}
          assistantName={name}
          busyChoice={busyChoice}
          error={importError}
          onChoose={handleImportChoice}
          onHide={() => {
            setPicked(null);
            setImportError('');
          }}
        />
      )}
      {notesDraft !== null && brain && (
        <NotesEditorModal
          brain={brain}
          initialDraft={notesDraft}
          fromFile={notesFromFile}
          themeColor={themeColor}
          onHide={() => setNotesDraft(null)}
          onSaved={(saved) => {
            setBrain(saved);
            setError('');
            setStatus('Notes saved.');
          }}
          onReload={reloadBrain}
        />
      )}
      {historyShown && brain && (
        <HistoryModal
          brain={brain}
          themeColor={themeColor}
          onHide={() => setHistoryShown(false)}
          onRestored={(restored) => {
            const instructionsChanged =
              restored.instructions !== brain.instructions;
            setBrain(restored);
            setError('');
            setStatus('Restored.');
            if (instructionsChanged) {
              onInstructionsChanged(restored.instructions);
            }
          }}
        />
      )}
    </ErrorBoundary>
  );

  async function reloadBrain() {
    const data = await loadTopicBrain({ channelId, topicId });
    const latest: TopicBrainData | null = data?.brain || null;
    if (latest) setBrain(latest);
    return latest;
  }

  async function handlePickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setStatus('');
    if (file.size > TOPIC_BRAIN_UPLOAD_MAX_BYTES) {
      setError(
        'That file is too big. Try a smaller one, or paste the important parts into your notes.'
      );
      return;
    }
    try {
      setPicked({
        fileName: file.name,
        mimeType: file.type || '',
        dataBase64: await readFileAsBase64(file)
      });
      setImportError('');
    } catch (err) {
      console.error(err);
      setError('Couldn’t open that file. Please try again.');
    }
  }

  async function handleImportChoice(choice: ImportChoice) {
    if (!picked || !brain || busyRef.current) return;
    busyRef.current = true;
    setBusyChoice(choice);
    setImportError('');
    try {
      if (choice === 'keep') {
        const { brain: saved } = await addTopicBrainFile({
          channelId,
          topicId,
          ...picked
        });
        const added = saved.files.length > brain.files.length;
        setBrain(saved);
        setStatus(
          added
            ? `${name} will read ${picked.fileName} every time you chat here.`
            : 'That file is already here.'
        );
      } else {
        const { text } = await readTopicBrainFile({
          channelId,
          topicId,
          ...picked
        });
        if (choice === 'notes') {
          setNotesFromFile(true);
          setNotesDraft([brain.notes, text].filter(Boolean).join('\n\n'));
        } else {
          onUseAsInstructions(text);
          setStatus(
            'The words are in Custom Instructions above. Press Save to keep them.'
          );
        }
      }
      setPicked(null);
    } catch (err: any) {
      console.error(err);
      setImportError(
        err?.message || 'Couldn’t read that file. Please try again.'
      );
    } finally {
      busyRef.current = false;
      setBusyChoice(null);
    }
  }

  async function handleRemoveFile(fileId: number) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(fileId);
    setError('');
    setStatus('');
    try {
      const { brain: saved } = await deleteTopicBrainFile({
        channelId,
        topicId,
        fileId
      });
      setBrain(saved);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Couldn’t take that file out. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  async function handleDownload() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy('download');
    setError('');
    setStatus('');
    try {
      const { fileName, markdown } = await exportTopicBrain({
        channelId,
        topicId
      });
      downloadTextFile(fileName, markdown);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Couldn’t make the download. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }
}

const headingCls = css`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #273449;
  font-size: calc(16 * var(--px));
  font-weight: 700;
`;

const blockCls = css`
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fafbfd;
`;

const blockHeadCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
  min-height: 40px;
`;

const emptyCls = css`
  margin: 4px 0 0;
  color: #526176;
  font-size: calc(14 * var(--px));
  line-height: 1.5;
`;

const notesPreviewCls = css`
  margin: 6px 0 0;
  color: #273449;
  font-size: calc(15 * var(--px));
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  overflow: hidden;
`;

const filesCls = css`
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  > li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    color: #273449;
    font-size: calc(15 * var(--px));
  }
  > li > span {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  > li > button {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #526176;
    cursor: pointer;
  }
  > li > button:hover:not(:disabled) {
    background: #eef1f5;
    color: #b42318;
  }
  > li > button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
