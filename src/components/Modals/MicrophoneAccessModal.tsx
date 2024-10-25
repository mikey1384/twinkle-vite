import React, { useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';

function MicrophoneAccessModal({
  isShown,
  onHide,
  onSuccess
}: {
  isShown: boolean;
  onHide: () => void;
  onSuccess: () => void;
}) {
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  if (!isShown) return null;

  return (
    <Modal onHide={onHide}>
      <header>Microphone Access Required</header>
      <main>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            width: 100%;
            font-size: 1.7rem;
            line-height: 1.6;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
        >
          {!showManualInstructions ? (
            <div
              className={css`
                width: 100%;
                display: flex;
                flex-direction: column;
              `}
            >
              <p>
                To enable voice calls, we need permission to use your
                microphone. Click the button below and allow access when
                prompted.
              </p>
              <div
                className={css`
                  display: flex;
                  align-items: flex-start;
                  gap: 1rem;
                  width: 100%;
                  margin-top: 1rem;
                  padding: 1.5rem;
                  background: ${Color.lightBlue(0.3)};
                  border-radius: 8px;
                  font-size: 1.5rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.3rem;
                    padding: 1rem;
                  }
                `}
              >
                <Icon
                  icon="info-circle"
                  style={{ color: Color.blue(), fontSize: '2rem' }}
                />
                <p
                  className={css`
                    margin: 0;
                  `}
                >
                  {`Once you press the button below, your browser will show a popup at the top of the window. Click
                  "Allow" to enable the microphone.`}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={css`
                width: 100%;
                display: flex;
                flex-direction: column;
              `}
            >
              <p>
                {`It looks like microphone access was blocked. Here's how to
                enable it:`}
              </p>
              <nav
                className={css`
                  margin: 1.5rem 0;
                  padding: 0;
                  width: 100%;
                  font-size: 1.5rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.3rem;
                  }
                `}
              >
                <section
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: ${Color.highlightGray()};
                    border-radius: 8px;
                  `}
                >
                  <span
                    className={css`
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 24px;
                      height: 24px;
                      min-width: 24px; // Add this
                      flex-shrink: 0; // Add this
                      background: ${Color.blue()};
                      color: #fff;
                      border-radius: 50%;
                      font-weight: bold;
                    `}
                  >
                    1
                  </span>
                  <Icon
                    icon="microphone-slash"
                    style={{
                      color: Color.red(),
                      fontSize: '1.7rem'
                    }}
                  />
                  {`Look for the microphone icon in your browser's address
                  bar`}
                </section>
                <section
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: ${Color.highlightGray()};
                    border-radius: 8px;
                  `}
                >
                  <span
                    className={css`
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 24px;
                      height: 24px;
                      min-width: 24px;
                      flex-shrink: 0;
                      background: ${Color.blue()};
                      color: #fff;
                      border-radius: 50%;
                      font-weight: bold;
                    `}
                  >
                    2
                  </span>
                  <Icon
                    icon="check-circle"
                    style={{
                      color: Color.green(),
                      fontSize: '1.7rem'
                    }}
                  />
                  {`Click it and select "Allow" for microphone access`}
                </section>
                <section
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: ${Color.highlightGray()};
                    border-radius: 8px;
                  `}
                >
                  <span
                    className={css`
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 24px;
                      height: 24px;
                      min-width: 24px; // Add this
                      flex-shrink: 0; // Add this
                      background: ${Color.blue()};
                      color: #fff;
                      border-radius: 50%;
                      font-weight: bold;
                    `}
                  >
                    3
                  </span>
                  <Icon
                    icon="redo"
                    style={{
                      color: Color.blue(),
                      fontSize: '1.7rem'
                    }}
                  />
                  Reload this page and try again
                </section>
              </nav>
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  margin-top: 1.5rem;
                  color: ${Color.blue()};
                  font-size: 1.4rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.2rem;
                  }
                  a {
                    color: inherit;
                    text-decoration: none;
                    &:hover {
                      text-decoration: underline;
                    }
                  }
                `}
              >
                <Icon
                  icon="question-circle"
                  style={{
                    color: 'inherit',
                    fontSize: '1.7rem'
                  }}
                />
                <a
                  href="https://support.google.com/chrome/answer/2693767?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: '0.5rem'
                  }}
                >
                  Need help? View detailed browser instructions
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer>
        {!showManualInstructions ? (
          <Button color="blue" onClick={requestMicrophoneAccess}>
            <Icon icon="microphone" />
            <span style={{ marginLeft: '0.7rem' }}>Enable Microphone</span>
          </Button>
        ) : null}
        <Button style={{ marginLeft: '0.7rem' }} transparent onClick={onHide}>
          {showManualInstructions ? 'Close' : 'Cancel'}
        </Button>
      </footer>
    </Modal>
  );

  async function requestMicrophoneAccess() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onSuccess();
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      setShowManualInstructions(true);
    }
  }
}

export default MicrophoneAccessModal;
