import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { useAppContext } from '~/contexts';
import { Color, borderRadius } from '~/constants/css';

const settingsBodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  font-size: 1.1rem;
`;

const optionClass = css`
  width: 100%;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  background: ${Color.wellGray(0.18)};
  color: ${Color.black()};
  &[data-disabled='true'] {
    opacity: 0.7;
  }
`;

const optionTextClass = css`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: 700;
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
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
      size="md"
      title="Notification settings"
      footer={
        <Button color="darkerGray" onClick={onClose} size="sm" variant="soft">
          Done
        </Button>
      }
    >
      <div className={settingsBodyClass}>
        {eventKey ? (
          <div
            className={optionClass}
            data-disabled={loading || saving ? 'true' : 'false'}
          >
            <SwitchButton
              ariaLabel={`Mute ${eventMuteLabel}`}
              checked={Boolean(preferences?.mutedEvent)}
              disabled={loading || Boolean(saving)}
              label={
                <span className={optionTextClass}>Mute {eventMuteLabel}</span>
              }
              labelStyle={{ flex: 1, marginRight: 0 }}
              onChange={() =>
                void updatePreference('event', !preferences?.mutedEvent)
              }
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%'
              }}
            />
          </div>
        ) : null}
        <div
          className={optionClass}
          data-disabled={loading || saving ? 'true' : 'false'}
        >
          <SwitchButton
            ariaLabel={buildMuteLabel}
            checked={Boolean(preferences?.mutedBuild)}
            disabled={loading || Boolean(saving)}
            label={<span className={optionTextClass}>{buildMuteLabel}</span>}
            labelStyle={{ flex: 1, marginRight: 0 }}
            onChange={() =>
              void updatePreference('build', !preferences?.mutedBuild)
            }
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%'
            }}
          />
        </div>
        {error ? <div className={errorClass}>{error}</div> : null}
      </div>
    </Modal>
  );
}
