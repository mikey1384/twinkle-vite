import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

type BrowserKind = 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';

function detectBrowser(): BrowserKind {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Firefox/')) return 'firefox';
  if (ua.includes('Chrome/')) return 'chrome';
  if (ua.includes('Safari/')) return 'safari';
  return 'other';
}

const stepsByBrowser: Record<BrowserKind, string[]> = {
  chrome: [
    'Look at the top of your browser, where the website address is.',
    'Click the little icon on the left side of the address (it looks like a lock or two small sliders).',
    'In the menu that pops up, find "Notifications".',
    'Turn it on (or choose "Allow").',
    'Come back to this page and turn the switch on again.'
  ],
  edge: [
    'Look at the top of your browser, where the website address is.',
    'Click the lock icon on the left side of the address.',
    'Click "Permissions for this site", then find "Notifications".',
    'Change it to "Allow".',
    'Come back to this page and turn the switch on again.'
  ],
  safari: [
    'Click "Safari" at the very top-left of your screen, then click "Settings...".',
    'Click the "Websites" tab at the top of the window.',
    'Click "Notifications" in the list on the left.',
    'Find this website in the list and change it to "Allow".',
    'Come back to this page and turn the switch on again.'
  ],
  firefox: [
    'Look at the top of your browser, where the website address is.',
    'Click the small icon on the left side of the address (it looks like a lock or a shield).',
    'Find where it says notifications are "Blocked" and click the "X" next to it.',
    'Come back to this page and turn the switch on again.',
    'When your browser asks about notifications, choose "Allow".'
  ],
  other: [
    'Open your browser\'s settings.',
    'Search for "Notifications".',
    'Find this website in the list and change it to "Allow".',
    'Come back to this page and turn the switch on again.'
  ]
};

export default function DesktopNotificationsHelpModal({
  onHide
}: {
  onHide: () => void;
}) {
  const steps = useMemo(() => stepsByBrowser[detectBrowser()], []);

  return (
    <Modal
      modalKey="DesktopNotificationsHelpModal"
      isOpen
      size="md"
      title="Allow notifications"
      onClose={onHide}
      footer={
        <Button color="logoBlue" variant="solid" onClick={onHide}>
          Got it
        </Button>
      }
    >
      <div
        className={css`
          font-size: 1.4rem;
          line-height: 1.7;
          color: ${Color.darkerGray()};
        `}
      >
        <p>
          <Icon icon="bell-slash" style={{ marginRight: '0.7rem' }} />
          Your browser is currently <b>blocking</b> notifications from Twinkle,
          so the switch can{`'`}t be turned on yet. Here{`'`}s how to allow
          them:
        </p>
        <ol
          className={css`
            margin-top: 1.5rem;
            padding-left: 2.2rem;
            li {
              margin-bottom: 0.7rem;
            }
          `}
        >
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}
