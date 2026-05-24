import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { Color, borderRadius } from '~/constants/css';

const settingsBodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 1.1rem;
`;

const optionClass = css`
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  color: var(--chat-text);
  input {
    width: 1.1rem;
    height: 1.1rem;
    flex: 0 0 auto;
  }
  &[data-disabled='true'] {
    cursor: progress;
    opacity: 0.7;
  }
`;

const optionTextClass = css`
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: 700;
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
`;

const footerClass = css`
  display: flex;
  justify-content: flex-end;
`;

export interface BuildAppNotificationPreferences {
  buildId: number;
  eventKey: string;
  mutedBuild: boolean;
  mutedEvent: boolean;
}

export default function BuildAppNotificationSettingsModal({
  buildId,
  buildTitle,
  eventKey,
  eventLabel,
  isOpen,
  onClose,
  onPreferencesChange
}: {
  buildId: number;
  buildTitle: string;
  eventKey: string;
  eventLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange?: (preferences: BuildAppNotificationPreferences) => void;
}) {
  const getBuildAppNotificationPreferences = useAppContext(
    (v) => v.requestHelpers.getBuildAppNotificationPreferences
  );
  const updateBuildAppNotificationPreferences = useAppContext(
    (v) => v.requestHelpers.updateBuildAppNotificationPreferences
  );
  const getBuildAppNotificationPreferencesRef = useRef(
    getBuildAppNotificationPreferences
  );
  const updateBuildAppNotificationPreferencesRef = useRef(
    updateBuildAppNotificationPreferences
  );
  const onPreferencesChangeRef = useRef(onPreferencesChange || null);
  const [preferences, setPreferences] =
    useState<BuildAppNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const eventMuteLabel = eventLabel || 'this notification type';
  const buildMuteLabel = buildTitle ? `Mute ${buildTitle}` : 'Mute this Build';

  useEffect(() => {
    getBuildAppNotificationPreferencesRef.current =
      getBuildAppNotificationPreferences;
    updateBuildAppNotificationPreferencesRef.current =
      updateBuildAppNotificationPreferences;
    onPreferencesChangeRef.current = onPreferencesChange || null;
  });

  useEffect(() => {
    if (!isOpen || !buildId) return;
    let cancelled = false;

    async function loadPreferences() {
      setLoading(true);
      setError('');
      try {
        const result =
          await getBuildAppNotificationPreferencesRef.current({
            buildId,
            eventKey
        });
        if (!cancelled) {
          setPreferences(result);
          onPreferencesChangeRef.current?.(result);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || 'Could not load settings.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [buildId, eventKey, isOpen]);

  async function updatePreference(kind: 'build' | 'event', muted: boolean) {
    if (!buildId || saving) return;
    setSaving(kind);
    setError('');
    try {
      const result =
        await updateBuildAppNotificationPreferencesRef.current({
          buildId,
          eventKey,
          mutedBuild: kind === 'build' ? muted : undefined,
          mutedEvent: kind === 'event' ? muted : undefined
        });
      setPreferences(result);
      onPreferencesChangeRef.current?.(result);
    } catch (updateError: any) {
      setError(updateError?.message || 'Could not update settings.');
    } finally {
      setSaving('');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      modalKey="BuildAppNotificationSettingsModal"
      onClose={onClose}
      size="sm"
      title="Notification settings"
    >
      <div className={settingsBodyClass}>
        {eventKey ? (
          <label
            className={optionClass}
            data-disabled={loading || saving === 'event' ? 'true' : 'false'}
          >
            <input
              checked={Boolean(preferences?.mutedEvent)}
              disabled={loading || Boolean(saving)}
              onChange={(event) =>
                void updatePreference('event', event.currentTarget.checked)
              }
              type="checkbox"
            />
            <span className={optionTextClass}>Mute {eventMuteLabel}</span>
          </label>
        ) : null}
        <label
          className={optionClass}
          data-disabled={loading || saving === 'build' ? 'true' : 'false'}
        >
          <input
            checked={Boolean(preferences?.mutedBuild)}
            disabled={loading || Boolean(saving)}
            onChange={(event) =>
              void updatePreference('build', event.currentTarget.checked)
            }
            type="checkbox"
          />
          <span className={optionTextClass}>{buildMuteLabel}</span>
        </label>
        {error ? <div className={errorClass}>{error}</div> : null}
        <div className={footerClass}>
          <Button color="darkerGray" onClick={onClose} size="sm" variant="soft">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
