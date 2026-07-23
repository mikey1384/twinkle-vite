import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import ItemPanel from './ItemPanel';
import DesktopNotificationsHelpModal from './DesktopNotificationsHelpModal';
import AddToHomeScreenModal from './AddToHomeScreenModal';
import Button from '~/components/Button';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { useAppContext, useChatContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { isMobile, isTablet } from '~/helpers';
import type {
  BackgroundGroupNotificationMode,
  ChatNotificationPreferences,
  MutedChatConversation
} from '~/types/chat';
import {
  chatPushSupported,
  desktopNotificationsSupported,
  disableDesktopNotifications,
  enableDesktopNotifications,
  getDesktopNotificationStatus,
  setupChatPushBestEffort,
  showDesktopNotification,
  unsubscribeFromChatPush
} from '~/helpers/desktopNotifications';

const deviceIsMobile = isMobile(navigator) || isTablet(navigator);
// iOS Safari exposes the Notification API only after the site is installed to
// the Home Screen; detect iOS (incl. iPadOS reporting as Macintosh) so we can
// show install guidance instead of a dead toggle.
const deviceIsIos =
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document);

const sectionClass = css`
  margin-top: 1.7rem;
`;

const sectionTitleClass = css`
  margin: 0;
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const sectionDescriptionClass = css`
  margin: 0.35rem 0 0;
  color: ${Color.darkGray()};
  font-size: 1.1rem;
  line-height: 1.45;
`;

const settingRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.4rem;
  margin-top: 0.85rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: ${Color.wellGray(0.18)};

  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
  }
`;

const settingCopyClass = css`
  min-width: 0;
  flex: 1;
`;

const settingLabelClass = css`
  color: ${Color.darkerGray()};
  font-size: 1.2rem;
  font-weight: 700;
`;

const settingDescriptionClass = css`
  margin-top: 0.25rem;
  color: ${Color.darkGray()};
  font-size: 1.1rem;
  line-height: 1.4;
`;

const selectClass = css`
  flex: none;
  min-width: 14rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: ${Color.white()};
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0.75rem 2.6rem 0.75rem 0.9rem;
`;

const errorClass = css`
  margin-top: 1rem;
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 700;
`;

export default function ChatNotificationsItem({
  loading
}: {
  loading?: boolean;
}) {
  const loadChatNotificationSettings = useAppContext(
    (v) => v.requestHelpers.loadChatNotificationSettings
  );
  const updateChatNotificationPreferences = useAppContext(
    (v) => v.requestHelpers.updateChatNotificationPreferences
  );
  const updateChatNotificationMute = useAppContext(
    (v) => v.requestHelpers.updateChatNotificationMute
  );
  const loadPushVapidKey = useAppContext(
    (v) => v.requestHelpers.loadPushVapidKey
  );
  const savePushSubscription = useAppContext(
    (v) => v.requestHelpers.savePushSubscription
  );
  const deletePushSubscription = useAppContext(
    (v) => v.requestHelpers.deletePushSubscription
  );
  const notificationSettings = useChatContext(
    (v) => v.state.chatNotificationSettings
  );
  const onSetChatNotificationSettings = useChatContext(
    (v) => v.actions.onSetChatNotificationSettings
  );

  const [deviceStatus, setDeviceStatus] = useState(
    getDesktopNotificationStatus()
  );
  const [helpModalShown, setHelpModalShown] = useState(false);
  const [installGuideShown, setInstallGuideShown] = useState(false);
  const [deviceUpdating, setDeviceUpdating] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(
    !notificationSettings
  );
  const [savingPreference, setSavingPreference] = useState('');
  const [mutedChannelSaving, setMutedChannelSaving] = useState(0);
  const [mutedConversationsShown, setMutedConversationsShown] = useState(false);
  const [error, setError] = useState('');

  const notificationApiAvailable = desktopNotificationsSupported();
  const preferences = notificationSettings?.preferences;
  const mutedConversations: MutedChatConversation[] =
    notificationSettings?.mutedConversations || [];

  useEffect(() => {
    if (notificationSettings) {
      setPreferencesLoading(false);
      return;
    }
    let cancelled = false;
    loadSettings();

    async function loadSettings() {
      setPreferencesLoading(true);
      try {
        const settings = await loadChatNotificationSettings();
        if (!cancelled) {
          onSetChatNotificationSettings(settings);
          setError('');
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(
            loadError?.message || 'Could not load notification settings.'
          );
        }
      } finally {
        if (!cancelled) {
          setPreferencesLoading(false);
        }
      }
    }

    return () => {
      cancelled = true;
    };
    // Stable context actions and request helpers are intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationSettings]);

  return (
    <div data-scroll-anchor-id="home-settings:chat-notifications">
      <ItemPanel
        itemKey="desktopNotifications"
        itemName="Notification settings"
        itemDescription="Choose what Twinkle should notify you about on each device."
        loading={loading}
      >
        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>This device</h3>
          <PreferenceToggleRow
            checked={deviceStatus === 'enabled'}
            description={getDeviceDescription()}
            disabled={
              deviceUpdating ||
              (!notificationApiAvailable && !(deviceIsMobile && deviceIsIos))
            }
            label="Allow notifications on this device"
            onChange={handleDeviceToggle}
          />
        </section>

        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>
            While Twinkle is in the background
          </h3>
          <p className={sectionDescriptionClass}>
            Another tab is open, or the app is minimized.
          </p>
          <PreferenceToggleRow
            checked={Boolean(preferences?.backgroundDirectMessages)}
            description="Messages sent directly to you, including attachments."
            disabled={
              preferencesLoading ||
              Boolean(savingPreference) ||
              !preferences
            }
            label="Direct messages"
            onChange={() =>
              handlePreferenceUpdate('backgroundDirectMessages', {
                backgroundDirectMessages:
                  !preferences?.backgroundDirectMessages
              })
            }
          />
          <div className={settingRowClass}>
            <div className={settingCopyClass}>
              <div className={settingLabelClass}>Group chats</div>
              <div className={settingDescriptionClass}>
                Choose whether all messages, only mentions, or no group
                messages notify you.
              </div>
            </div>
            <select
              aria-label="Group chat notifications while Twinkle is in the background"
              className={selectClass}
              disabled={
                preferencesLoading ||
                Boolean(savingPreference) ||
                !preferences
              }
              value={preferences?.backgroundGroupMode || 'all'}
              onChange={(event) =>
                handlePreferenceUpdate('backgroundGroupMode', {
                  backgroundGroupMode: event.target
                    .value as BackgroundGroupNotificationMode
                })
              }
            >
              <option value="all">All messages</option>
              <option value="mentions">Mentions only</option>
              <option value="off">Off</option>
            </select>
          </div>
          <PreferenceToggleRow
            checked={Boolean(preferences?.backgroundAiReplies)}
            description="When Zero or Ciel finishes replying while Twinkle remains connected."
            disabled={
              preferencesLoading ||
              Boolean(savingPreference) ||
              !preferences
            }
            label="AI replies"
            onChange={() =>
              handlePreferenceUpdate('backgroundAiReplies', {
                backgroundAiReplies: !preferences?.backgroundAiReplies
              })
            }
          />
        </section>

        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>When Twinkle is closed</h3>
          <p className={sectionDescriptionClass}>
            These notifications are delivered through background push.
          </p>
          <PreferenceToggleRow
            checked={Boolean(preferences?.closedDirectMessages)}
            description="Direct messages, including first messages and attachments."
            disabled={
              preferencesLoading ||
              Boolean(savingPreference) ||
              !preferences
            }
            label="Direct messages"
            onChange={() =>
              handlePreferenceUpdate('closedDirectMessages', {
                closedDirectMessages: !preferences?.closedDirectMessages
              })
            }
          />
          <PreferenceToggleRow
            checked={Boolean(preferences?.closedGroupMentions)}
            description="Only group messages that mention you."
            disabled={
              preferencesLoading ||
              Boolean(savingPreference) ||
              !preferences
            }
            label="Group mentions"
            onChange={() =>
              handlePreferenceUpdate('closedGroupMentions', {
                closedGroupMentions: !preferences?.closedGroupMentions
              })
            }
          />
        </section>

        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>Muted conversations</h3>
          <p className={sectionDescriptionClass}>
            Muting a conversation overrides both sections above without
            changing its unread messages.
          </p>
          <div className={settingRowClass}>
            <div className={settingCopyClass}>
              <div className={settingLabelClass}>
                {mutedConversations.length
                  ? `${mutedConversations.length} muted conversation${
                      mutedConversations.length === 1 ? '' : 's'
                    }`
                  : 'No conversations muted'}
              </div>
            </div>
            <Button
              color="darkerGray"
              disabled={preferencesLoading}
              size="sm"
              uppercase={false}
              variant="soft"
              onClick={() =>
                setMutedConversationsShown(!mutedConversationsShown)
              }
            >
              {mutedConversationsShown ? 'Hide' : 'Manage'}
            </Button>
          </div>
          {mutedConversationsShown &&
            mutedConversations.map((conversation) => (
              <div className={settingRowClass} key={conversation.channelId}>
                <div className={settingCopyClass}>
                  <div className={settingLabelClass}>{conversation.title}</div>
                  <div className={settingDescriptionClass}>
                    {conversation.twoPeople ? 'Direct message' : 'Group chat'}
                  </div>
                </div>
                <Button
                  color="rose"
                  loading={mutedChannelSaving === conversation.channelId}
                  size="sm"
                  uppercase={false}
                  variant="soft"
                  onClick={() => handleUnmute(conversation.channelId)}
                >
                  Unmute
                </Button>
              </div>
            ))}
        </section>

        {preferencesLoading && (
          <div className={sectionDescriptionClass}>
            Loading notification preferences…
          </div>
        )}
        {error && <div className={errorClass}>{error}</div>}

        {helpModalShown && (
          <DesktopNotificationsHelpModal
            onHide={() => setHelpModalShown(false)}
          />
        )}
        {installGuideShown && (
          <AddToHomeScreenModal onHide={() => setInstallGuideShown(false)} />
        )}
      </ItemPanel>
    </div>
  );

  function getDeviceDescription() {
    if (!notificationApiAvailable) {
      return deviceIsMobile && deviceIsIos
        ? 'Add Twinkle to your Home Screen to enable notifications.'
        : 'Notifications are not supported by this browser.';
    }
    if (deviceStatus === 'blocked') {
      return 'Notifications are blocked by your browser or device settings.';
    }
    if (deviceStatus === 'enabled') {
      return 'Enabled on this browser or installed app.';
    }
    return 'Turning this off affects only this browser or installed app.';
  }

  async function handleDeviceToggle() {
    if (!notificationApiAvailable) {
      setInstallGuideShown(true);
      return;
    }
    if (deviceUpdating) return;
    setDeviceUpdating(true);
    setError('');
    try {
      if (deviceStatus === 'enabled') {
        await disableNotificationsOnDevice();
        return;
      }
      await enableNotificationsOnDevice();
    } finally {
      setDeviceUpdating(false);
    }

    async function disableNotificationsOnDevice() {
      try {
        const endpoint = await unsubscribeFromChatPush();
        if (endpoint) {
          await deletePushSubscription(endpoint);
        }
      } catch {
        setError(
          'Notifications are off on this device, but Twinkle could not finish cleaning up its background push registration.'
        );
      } finally {
        setDeviceStatus(disableDesktopNotifications());
      }
    }

    async function enableNotificationsOnDevice() {
      const newStatus = await enableDesktopNotifications();
      setDeviceStatus(newStatus);
      if (newStatus === 'blocked') {
        setHelpModalShown(true);
        return;
      }
      if (newStatus !== 'enabled') return;

      if (chatPushSupported()) {
        const pushStatus = await setupChatPushBestEffort({
          loadVapidKey: loadPushVapidKey,
          saveSubscription: savePushSubscription
        });
        if (pushStatus === 'failed') {
          setError(
            'Notifications are enabled while Twinkle is open, but closed-app push could not be enabled on this device.'
          );
        }
      }
      showDesktopNotification({
        title: 'Twinkle notifications are on',
        body: 'You can choose what notifies you in these settings'
      });
    }
  }

  async function handlePreferenceUpdate(
    key: keyof ChatNotificationPreferences,
    update: Partial<ChatNotificationPreferences>
  ) {
    if (!preferences || savingPreference) return;
    setSavingPreference(key);
    setError('');
    try {
      const settings = await updateChatNotificationPreferences(update);
      onSetChatNotificationSettings(settings);
    } catch (updateError: any) {
      setError(
        updateError?.message || 'Could not update notification preferences.'
      );
    } finally {
      setSavingPreference('');
    }
  }

  async function handleUnmute(channelId: number) {
    if (mutedChannelSaving) return;
    setMutedChannelSaving(channelId);
    setError('');
    try {
      const settings = await updateChatNotificationMute({
        channelId,
        muted: false
      });
      onSetChatNotificationSettings(settings);
    } catch (updateError: any) {
      setError(updateError?.message || 'Could not unmute this conversation.');
    } finally {
      setMutedChannelSaving(0);
    }
  }
}

function PreferenceToggleRow({
  checked,
  description,
  disabled,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <div className={settingRowClass}>
      <div className={settingCopyClass}>
        <div className={settingLabelClass}>{label}</div>
        <div className={settingDescriptionClass}>{description}</div>
      </div>
      <SwitchButton
        ariaLabel={label}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        small
      />
    </div>
  );
}
