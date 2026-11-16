import React, { useEffect, useId, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import { useAppContext } from '~/contexts';
import { TOPIC_BRAIN_NOTES_MAX, type TopicBrain } from '~/helpers/topicBrain';
import { chatTopicButtonStyle, chatTopicModalClass } from '../../topicStyles';
import { topicSettingsHelpClass, topicSettingsLabelClass } from '../styles';

// The member's own notes for this topic. Save sends the draft against the
// revision it started from; what the server answers is what the page shows.
export default function NotesEditorModal({
  brain,
  initialDraft,
  fromFile = false,
  themeColor,
  onHide,
  onSaved,
  onReload
}: {
  brain: TopicBrain;
  // words taken from a file, already joined to the saved notes
  initialDraft?: string;
  fromFile?: boolean;
  themeColor: string;
  onHide: () => void;
  onSaved: (brain: TopicBrain) => void;
  // the notes changed somewhere else: get the newest brain
  onReload: () => Promise<TopicBrain | null>;
}) {
  const inputId = useId();
  const saveTopicBrainNotes = useAppContext(
    (v) => v.requestHelpers.saveTopicBrainNotes
  );
  const [draft, setDraft] = useState(initialDraft ?? brain.notes);
  const [baseRevision, setBaseRevision] = useState(brain.revision);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const tooLong = draft.length > TOPIC_BRAIN_NOTES_MAX;
  const unchanged = draft.trim() === brain.notes.trim() && !error;

  return (
    <Modal
      modalKey="TopicBrainNotesEditor"
      isOpen
      onClose={handleClose}
      size="md"
      modalLevel={3}
      title="Notes for next time"
      aria-label="Notes for next time"
      className={chatTopicModalClass}
      style={{ width: 'min(640px, calc(100vw - 24px))', maxWidth: '100%' }}
      bodyPadding="12px"
      footer={
        <>
          {error && (
            <p
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className={topicSettingsHelpClass}
              data-error="true"
              style={{ width: '100%', margin: 0 }}
            >
              {error}
            </p>
          )}
          <Button variant="ghost" disabled={saving} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            color={themeColor}
            style={chatTopicButtonStyle(themeColor)}
            loading={saving}
            disabled={saving || tooLong || unchanged}
            onClick={handleSave}
          >
            Save
          </Button>
        </>
      }
    >
      <div style={{ width: '100%' }}>
        <label htmlFor={inputId} className={topicSettingsLabelClass}>
          What should {brain.assistantName} remember here?
        </label>
        <Textarea
          id={inputId}
          placeholder={
            'Where we are: finished chapter 2 of my story.\nWhat’s next: plan the dragon fight.\nRemember: I like short answers.'
          }
          style={{ width: '100%', position: 'relative', minHeight: '8rem' }}
          hasError={tooLong}
          aria-invalid={tooLong}
          aria-describedby={`${inputId}-help`}
          minRows={8}
          maxRows={18}
          value={draft}
          disabled={saving}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDraft(event.target.value)
          }
        />
        <p
          id={`${inputId}-help`}
          className={topicSettingsHelpClass}
          data-error={tooLong}
        >
          {tooLong
            ? 'These notes are too long to keep. Shorten them, or keep the long part as a file.'
            : `${brain.assistantName} reads these every time you chat in this topic. Only you can see them.`}
        </p>
      </div>
    </Modal>
  );

  function handleClose() {
    if (!savingRef.current) onHide();
  }

  async function handleSave() {
    if (savingRef.current || tooLong) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const { brain: saved } = await saveTopicBrainNotes({
        channelId: brain.channelId,
        topicId: brain.topicId,
        baseRevision,
        notes: draft,
        fromFile
      });
      onSaved(saved);
      onHide();
    } catch (err: any) {
      console.error(err);
      if (err?.status === 409) {
        // Saved somewhere else since this window opened: keep these words
        // and let a second Save put them on top of the newest notes.
        const latest = await onReload().catch(() => null);
        if (latest) setBaseRevision(latest.revision);
        setError(
          'These notes were changed somewhere else. Your words are still here: press Save again to keep them.'
        );
      } else {
        setError(
          err?.message ||
            "Couldn't save your notes. Your words are still here; please try again."
        );
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
}
