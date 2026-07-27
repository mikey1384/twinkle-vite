import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import ItemPanel from './ItemPanel';
import DesktopNotificationsHelpModal from './DesktopNotificationsHelpModal';
import AddToHomeScreenModal from './AddToHomeScreenModal';
import Button from '~/components/Button';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { isMobile, isTablet } from '~/helpers';
import { getThisDevicePushPlatform } from '~/helpers/pushDevicePlatform';
import type {
  BackgroundGroupNotificationMode,
  ChatNotificationPreferences,
  ChatNotificationSettings,
  MutedChatConversation
} from '~/types/chat';
import {
  chatPushSupported,
  desktopNotificationsSupported,
  disableDesktopNotifications,
  enableDesktopNotifications,
  getDesktopNotificationStatus,
  hasLocalChatPushSubscription,
  setupChatPushBestEffort,
  showDesktopNotification,
  unsubscribeFromChatPush
} from '~/helpers/desktopNotifications';

const deviceIsMobile = isMobile(navigator) || isTablet(navigator);
const thisDevicePlatform = getThisDevicePushPlatform();
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

const noticeClass = css`
  margin: 0.6rem 0 0;
  color: ${Color.brown()};
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.45;
`;

const switchWithActionClass = css`
  flex: none;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const statusRowClass = css`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 1.3rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: ${Color.wellGray(0.18)};
`;

const statusIconClass = css`
  flex: none;
  margin-top: 0.15rem;
  font-size: 1.5rem;
`;

const statusTitleClass = css`
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  font-weight: 800;
`;

const statusDescriptionClass = css`
  margin-top: 0.25rem;
  color: ${Color.darkGray()};
  font-size: 1.1rem;
  line-height: 1.45;
`;

const disclosureButtonClass = css`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.85rem;
  padding: 0.75rem;
  border: 0;
  background: transparent;
  color: ${Color.darkerGray()};
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;

  &:hover {
    color: ${Color.logoBlue()};
  }

  &:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
`;

export default function ChatNotificationsItem({
  loading
}: {
  loading?: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  // Push toggles resolve after an await, so ownership has to be checked against
  // the signed-in user at that moment, not the one captured when it started.
  const latestUserIdRef = useRef(userId);
  latestUserIdRef.current = userId;
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
  // null until the probe resolves, so the status line never asserts anything
  // about this device before it knows.
  const [localPushSubscribed, setLocalPushSubscribed] = useState<boolean | null>(
    null
  );
  const [helpModalShown, setHelpModalShown] = useState(false);
  const [installGuideShown, setInstallGuideShown] = useState(false);
  const [deviceUpdating, setDeviceUpdating] = useState(false);
  const [preferencesLoading, setPreferencesLoading] =
    useState(!notificationSettings);
  const [savingPreference, setSavingPreference] = useState('');
  const [mutedChannelSaving, setMutedChannelSaving] = useState(0);
  const [mutedConversationsShown, setMutedConversationsShown] = useState(false);
  const [advancedSettingsShown, setAdvancedSettingsShown] = useState(false);
  const [error, setError] = useState('');

  const notificationApiAvailable = desktopNotificationsSupported();
  const preferences = notificationSettings?.preferences;
  const mutedConversations: MutedChatConversation[] =
    notificationSettings?.mutedConversations || [];
  // Whether closed-app push is deliverable at all is owned by the server: it is
  // the account's subscription rows, not this browser's permission. An API
  // predating the field omits it, and an unknown value must stay unknown rather
  // than render as "off".
  const accountPushSubscribed =
    typeof notificationSettings?.hasPushSubscription === 'boolean'
      ? notificationSettings.hasPushSubscription
      : null;
  const deviceNotificationsEnabled = deviceStatus === 'enabled';
  // Does the physical device you are holding receive push — through this
  // context or a sibling one? An iOS Safari tab holds no subscription and never
  // will, but the Home Screen app on the same phone may, and answering "no"
  // there is the lie this panel used to tell. An absent platform list (older
  // API) leaves this at whatever the local probe found.
  const thisDevicePushSubscribed =
    localPushSubscribed === true ||
    Boolean(
      notificationSettings?.pushDevicePlatforms?.includes(thisDevicePlatform)
    );
  // Whether this context can act on the switch at all. On iOS Safari it cannot:
  // the Notification API is absent, and the subscription belongs to the Home
  // Screen app, which is the only place that can add or remove it.
  const deviceSwitchActionable = notificationApiAvailable;
  // The preferences below choose what gets through on this device. They are
  // account-wide, but this panel is not a remote control for other devices:
  // when this device gets nothing, they answer a question you did not ask and
  // read as proof that something is set up when nothing is. Muted conversations
  // stay reachable either way — the mute control lives in each conversation's
  // own menu, which shows an existing mute unconditionally.
  const advancedSettingsAvailable =
    deviceNotificationsEnabled || thisDevicePushSubscribed;

  useEffect(() => {
    let cancelled = false;
    checkLocalSubscription();

    async function checkLocalSubscription() {
      const subscribed = await hasLocalChatPushSubscription();
      if (!cancelled) {
        setLocalPushSubscribed(subscribed);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [deviceStatus]);

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
        {renderPushStatus()}

        <section className={sectionClass}>
          <h3 className={sectionTitleClass}>This device</h3>
          {deviceSwitchActionable ? (
            <PreferenceToggleRow
              checked={deviceNotificationsEnabled}
              description={getDeviceDescription()}
              disabled={deviceUpdating}
              label="Allow notifications on this device"
              onChange={handleDeviceToggle}
            />
          ) : (
            // The switch still reports this device's real state — on when the
            // Home Screen app on this same phone is subscribed — but it is
            // disabled, because only that app can add or remove the
            // subscription. Turning it off from here could never stick: the app
            // re-enrolls itself on its next launch.
            <div className={settingRowClass}>
              <div className={settingCopyClass}>
                <div className={settingLabelClass}>
                  Notifications on this device
                </div>
                <div className={settingDescriptionClass}>
                  {getDeviceDescription()}
                </div>
              </div>
              <div className={switchWithActionClass}>
                <SwitchButton
                  ariaLabel="Notifications on this device"
                  checked={thisDevicePushSubscribed}
                  disabled
                  onChange={() => null}
                  small
                />
                {deviceIsMobile && deviceIsIos && !thisDevicePushSubscribed && (
                  <Button
                    color="logoBlue"
                    size="sm"
                    uppercase={false}
                    variant="soft"
                    onClick={() => setInstallGuideShown(true)}
                  >
                    Show me how
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        {advancedSettingsAvailable && (
          <button
            aria-controls="advanced-chat-notification-settings"
            aria-expanded={advancedSettingsShown}
            className={disclosureButtonClass}
            type="button"
            onClick={() => setAdvancedSettingsShown(!advancedSettingsShown)}
          >
            <span>
              {advancedSettingsShown ? 'Fewer settings' : 'More settings'}
            </span>
            <Icon icon={advancedSettingsShown ? 'chevron-up' : 'chevron-down'} />
          </button>
        )}

        {advancedSettingsAvailable && advancedSettingsShown && (
          <div id="advanced-chat-notification-settings">
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
              {accountPushSubscribed === false && (
                <p className={noticeClass}>
                  None of your devices are set up for push yet, so nothing is
                  delivered while Twinkle is closed no matter how these are set.
                </p>
              )}
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
                      <div className={settingLabelClass}>
                        {conversation.title}
                      </div>
                      <div className={settingDescriptionClass}>
                        {conversation.twoPeople
                          ? 'Direct message'
                          : 'Group chat'}
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

  // The panel's headline answer to "will Twinkle actually reach me when it is
  // closed?" That is an account fact (does any device hold a push
  // subscription), not a fact about the browser this is being read in — and on
  // iOS the Home Screen app and the Safari tab are separate contexts, so a
  // device-local reading of it is wrong in both directions.
  function renderPushStatus() {
    if (accountPushSubscribed === null || localPushSubscribed === null) {
      return null;
    }
    const { title, description, isOn } = getPushStatusCopy();
    return (
      <div className={statusRowClass}>
        <Icon
          className={statusIconClass}
          icon={isOn ? 'bell' : 'bell-slash'}
          style={{ color: isOn ? Color.green() : Color.gray() }}
        />
        <div className={settingCopyClass}>
          <div className={statusTitleClass}>{title}</div>
          <div className={statusDescriptionClass}>{description}</div>
        </div>
      </div>
    );
  }

  function getPushStatusCopy() {
    if (!accountPushSubscribed) {
      return {
        isOn: false,
        title: 'Push notifications are off',
        description:
          'No device is set up yet, so Twinkle cannot reach you while it is closed.'
      };
    }
    if (thisDevicePushSubscribed) {
      return {
        isOn: true,
        title: 'Push notifications are on for this device',
        description:
          localPushSubscribed || deviceSwitchActionable
            ? 'Twinkle can reach you here even when it is closed. What gets through is set below.'
            : 'Twinkle reaches this device through the app on your Home Screen, even when it is closed.'
      };
    }
    return {
      isOn: true,
      title: 'Push notifications are on for another device',
      description:
        deviceIsMobile && deviceIsIos && !deviceSwitchActionable
          ? 'Twinkle already sends them to a device you set up, but not to this phone. Add Twinkle to your Home Screen to get them here.'
          : 'Twinkle already sends them to a device you set up, but not to this one yet.'
    };
  }

  function getDeviceDescription() {
    if (!deviceSwitchActionable) {
      if (!(deviceIsMobile && deviceIsIos)) {
        return 'Notifications are not supported by this browser.';
      }
      return thisDevicePushSubscribed
        ? 'On through the Twinkle app on your Home Screen. Safari cannot change this — open Twinkle from your Home Screen to turn it off.'
        : 'Safari cannot show Twinkle notifications on iPhone or iPad. Add Twinkle to your Home Screen, open it from there, and turn notifications on.';
    }
    if (deviceStatus === 'blocked') {
      return 'Notifications are blocked by your browser or device settings.';
    }
    if (deviceStatus === 'enabled') {
      return 'Enabled on this browser or installed app.';
    }
    return 'Turning this off affects only this browser or installed app.';
  }

  // Toggling push returns a canonical snapshot, but the request outlives a
  // logout or account switch. Installing a departing account's snapshot over
  // cleared state would also make the reducer reject the arriving account's
  // own snapshot for having a different userId, so ownership is checked here.
  //
  // Checked against the ref, not the captured `userId`: this runs after an
  // await, and the value closed over is whoever was signed in when the toggle
  // started. Only the ref reflects who is signed in when the result lands.
  function applyPushSnapshot(settings?: ChatNotificationSettings | null) {
    const currentUserId = latestUserIdRef.current;
    if (
      !settings ||
      !currentUserId ||
      Number(settings.userId) !== Number(currentUserId)
    ) {
      return;
    }
    onSetChatNotificationSettings(settings);
  }

  async function handleDeviceToggle() {
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
          const result = await deletePushSubscription(endpoint);
          applyPushSnapshot(result?.chatNotificationSettings);
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
        const { status: pushStatus, chatNotificationSettings } =
          await setupChatPushBestEffort({
            loadVapidKey: loadPushVapidKey,
            saveSubscription: savePushSubscription
          });
        applyPushSnapshot(chatNotificationSettings);
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
