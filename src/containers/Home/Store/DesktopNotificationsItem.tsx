import React, { useState } from 'react';
import ItemPanel from './ItemPanel';
import DesktopNotificationsHelpModal from './DesktopNotificationsHelpModal';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { isMobile, isTablet } from '~/helpers';
import {
  desktopNotificationsSupported,
  disableDesktopNotifications,
  enableDesktopNotifications,
  getDesktopNotificationStatus,
  showDesktopNotification
} from '~/helpers/desktopNotifications';

const deviceIsMobile = isMobile(navigator) || isTablet(navigator);
const desktopNotificationsLabel = 'Desktop chat notifications';
const desktopNotificationsDescriptionLabel =
  'Get notified of new chat messages while you are on another tab. This item is free';

export default function DesktopNotificationsItem({
  loading
}: {
  loading?: boolean;
}) {
  const [status, setStatus] = useState(getDesktopNotificationStatus());
  const [helpModalShown, setHelpModalShown] = useState(false);

  if (deviceIsMobile || !desktopNotificationsSupported()) return null;

  return (
    <div data-scroll-anchor-id="home-settings:desktop-notifications">
      <ItemPanel
        itemKey="desktopNotifications"
        itemName={desktopNotificationsLabel}
        itemDescription={desktopNotificationsDescriptionLabel}
        loading={loading}
      >
        <div style={{ marginTop: '1rem' }}>
          <SwitchButton
            checked={status === 'enabled'}
            label={status === 'enabled' ? 'On' : 'Off'}
            onChange={handleToggle}
          />
        </div>
        {helpModalShown && (
          <DesktopNotificationsHelpModal
            onHide={() => setHelpModalShown(false)}
          />
        )}
      </ItemPanel>
    </div>
  );

  async function handleToggle() {
    if (status === 'enabled') {
      setStatus(disableDesktopNotifications());
      return;
    }
    const newStatus = await enableDesktopNotifications();
    setStatus(newStatus);
    if (newStatus === 'blocked') {
      setHelpModalShown(true);
    }
    if (newStatus === 'enabled') {
      showDesktopNotification({
        title: 'Twinkle chat notifications are on',
        body: 'You will be notified of new chat messages while you are on another tab'
      });
    }
  }
}
