import { useState } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { cloudFrontURL } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color } from '~/constants/css';

PasteCode.propTypes = {
  initialCode: PropTypes.string.isRequired,
  style: PropTypes.object,
  onCorrectCodeEntered: PropTypes.func.isRequired
};

export default function PasteCode({
  initialCode,
  style,
  onCorrectCodeEntered
}) {
  const [watched, setWatched] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        ...style
      }}
    >
      <h1 style={{ marginBottom: '3.5rem' }}>{`Follow along this video`}</h1>
      <div
        className={css`
          width: 70%;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        <div
          className="unselectable"
          style={{
            width: '100%',
            paddingTop: '57.25%',
            position: 'relative'
          }}
        >
          <ReactPlayer
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              left: 0,
              bottom: 0
            }}
            url={`${cloudFrontURL}/missions/replit/desktop-video-instruction-vite.mp4`}
            controls
          />
        </div>
      </div>
      {!watched && (
        <div
          className={css`
            margin-top: 7rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 4rem;
            }
          `}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button skeuomorphic color="green" onClick={() => setWatched(true)}>
            I followed along the video. What now?
          </Button>
        </div>
      )}
      {watched && (
        <div style={{ marginTop: '5rem', width: '100%' }}>
          <h2>
            {`1. Patiently wait until "[ `}
            <b style={{ color: Color.green() }}>ready</b> ] compliled
            successfully{`" shows up in the console`}
          </h2>
          <h2 style={{ marginTop: '2rem' }}>
            2. A six-digit code will show up in the top right screen
          </h2>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <img
              className={css`
                margin-top: 2rem;
                width: 80%;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 100%;
                }
              `}
              src={`${cloudFrontURL}/missions/replit/6-digit-code.png`}
            />
            <h1 style={{ marginTop: '5rem' }}>
              Enter the six-digit code below
            </h1>
            <Input
              className={css`
                margin-top: 1.5rem;
                width: 50%;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 100%;
                }
              `}
              type="text"
              maxLength={6}
              placeholder="Enter the 6-digit number"
              onChange={handleCodeInput}
              value={verificationCode}
            />
            {errorMsg && (
              <p
                style={{
                  color: Color.red(),
                  fontWeight: 'bold',
                  fontSize: '1.3rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function handleCodeInput(text) {
    setErrorMsg('');
    setVerificationCode(text);
    if (text.length === 6) {
      let correctSixDigit = '';
      for (let i = 0; i < initialCode.length; i++) {
        const number = initialCode.charCodeAt(i) % 10;
        correctSixDigit += number;
      }
      if (text === correctSixDigit) {
        onCorrectCodeEntered();
      } else {
        setErrorMsg(`The code you entered is incorrect. Please try again`);
      }
    }
  }
}
