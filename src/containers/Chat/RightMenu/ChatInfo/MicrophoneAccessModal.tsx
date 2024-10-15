import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

function MicrophoneAccessModal({
  show,
  onHide,
  onGrantAccess,
  showManualInstructions
}: {
  show: boolean;
  onHide: () => void;
  onGrantAccess: () => void;
  showManualInstructions: boolean;
}) {
  if (!show) return null;

  return (
    <Modal onHide={onHide}>
      <header>Microphone Access Required</header>
      <main>
        {!showManualInstructions ? (
          <>
            <p>
              To make calls, we need access to your microphone. Click the button
              below to grant access.
            </p>
            <p>
              You may see a browser prompt asking for permission. Please
              {`select "Allow" to enable the microphone.`}
            </p>
          </>
        ) : (
          <>
            <p>
              It seems you may have blocked microphone access. Please follow
              these steps to enable it:
            </p>
            <ol>
              <li>{`Click the lock icon (🔒) or site information icon in your browser's address bar.`}</li>
              <li>{`Find the microphone settings and change it to "Allow".`}</li>
              <li>Refresh the page and try again.</li>
            </ol>
            <p>
              For detailed instructions for your specific browser, please visit:{' '}
              <a
                href="https://support.google.com/chrome/answer/2693767?hl=en"
                target="_blank"
                rel="noopener noreferrer"
              >
                Browser Microphone Settings
              </a>
            </p>
          </>
        )}
      </main>
      <footer>
        {!showManualInstructions ? (
          <Button color="blue" onClick={onGrantAccess}>
            Grant Microphone Access
          </Button>
        ) : null}
        <Button transparent onClick={onHide}>
          {showManualInstructions ? 'Close' : 'Cancel'}
        </Button>
      </footer>
    </Modal>
  );
}

export default MicrophoneAccessModal;
