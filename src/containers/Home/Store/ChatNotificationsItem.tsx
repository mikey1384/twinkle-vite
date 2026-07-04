import React, { useState } from 'react';
import ItemPanel from './ItemPanel';
import DesktopNotificationsHelpModal from './DesktopNotificationsHelpModal';
import AddToHomeScreenModal from './AddToHomeScreenModal';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { useAppContext } from '~/contexts';
import { isMobile, isTablet } from '~/helpers';
import {
  chatPushSupported,
  desktopNotificationsSupported,
  disableDesktopNotifications,
  enableDesktopNotifications,
  getDesktopNotificationStatus,
  showDesktopNotification,
  subscribeToChatPush,
  unsubscribeFromChatPush
} from '~/helpers/desktopNotifications';

const deviceIsMobile = isMobile(navigator) || isTablet(navigator);
// iOS Safari exposes the Notification API only after the site is installed to
// the Home Screen; detect iOS (incl. iPadOS reporting as Macintosh) so we can
// show install guidance instead of a dead toggle.
const deviceIsIos =
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document);
const chatNotificationsLabel = 'Chat notifications';
const chatNotificationsDescriptionLabel =
  'Get notified when you receive a direct message or get mentioned, even while you are away from Twinkle. This item is free';

export default function ChatNotificationsItem({
  loading
}: {
  loading?: boolean;
}) {
  const loadPushVapidKey = useAppContext(
    (v) => v.requestHelpers.loadPushVapidKey
  );
  const savePushSubscription = useAppContext(
    (v) => v.requestHelpers.savePushSubscription
  );
  const deletePushSubscription = useAppContext(
    (v) => v.requestHelpers.deletePushSubscription
  );
  const [status, setStatus] = useState(getDesktopNotificationStatus());
  const [helpModalShown, setHelpModalShown] = useState(false);
  const [installGuideShown, setInstallGuideShown] = useState(false);
  const [updating, setUpdating] = useState(false);

  const notificationApiAvailable = desktopNotificationsSupported();
  if (!notificationApiAvailable && !(deviceIsMobile && deviceIsIos)) {
    return null;
  }

  return (
    <div data-scroll-anchor-id="home-settings:chat-notifications">
      <ItemPanel
        itemKey="desktopNotifications"
        itemName={chatNotificationsLabel}
        itemDescription={chatNotificationsDescriptionLabel}
        loading={loading}
      >
        <div style={{ marginTop: '1rem' }}>
          <SwitchButton
            checked={status === 'enabled'}
            disabled={updating}
            label={status === 'enabled' ? 'On' : 'Off'}
            onChange={handleToggle}
          />
        </div>
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

  async function handleToggle() {
    if (!notificationApiAvailable) {
      setInstallGuideShown(true);
      return;
    }
    if (updating) return;
    setUpdating(true);
    try {
      if (status === 'enabled') {
        setStatus(disableDesktopNotifications());
        const endpoint = await unsubscribeFromChatPush();
        if (endpoint) {
          await deletePushSubscription(endpoint);
        }
        return;
      }
      const newStatus = await enableDesktopNotifications();
      if (newStatus === 'enabled' && chatPushSupported()) {
        try {
          const publicKey = await loadPushVapidKey();
          if (publicKey) {
            const subscription = await subscribeToChatPush(publicKey);
            if (subscription) {
              await savePushSubscription(subscription);
            }
          }
        } catch (error) {
          // push is an enhancement; in-page notifications still work
          console.error('Failed to set up push notifications:', error);
        }
      }
      setStatus(newStatus);
      if (newStatus === 'blocked') {
        setHelpModalShown(true);
      }
      if (newStatus === 'enabled') {
        showDesktopNotification({
          title: 'Twinkle chat notifications are on',
          body: 'You will be notified when you receive a direct message or get mentioned'
        });
      }
    } finally {
      setUpdating(false);
    }
  }
}
