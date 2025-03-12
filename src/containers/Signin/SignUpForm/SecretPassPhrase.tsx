import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const WRONG_ANSWER = 'Wrong answer';
const passphraseLabel = localize('passphrase');

export default function SecretPassPhrase({
  onSetIsPassphraseValid,
  onSetPassphrase,
  passphrase
}: {
  onSetIsPassphraseValid: (value: boolean) => void;
  onSetPassphrase: (passphrase: string) => void;
  passphrase: string;
}) {
  const verifyPassphrase = useAppContext(
    (v) => v.requestHelpers.verifyPassphrase
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      onSetIsPassphraseValid(false);
      if (passphrase) {
        setLoading(true);
        try {
          const isMatch = await verifyPassphrase(passphrase);
          if (!isMatch) {
            setErrorMessage(WRONG_ANSWER);
            onSetIsPassphraseValid(false);
          } else {
            setErrorMessage('');
            onSetIsPassphraseValid(true);
          }
        } catch (error: any) {
          console.error(error);
          setErrorMessage(WRONG_ANSWER);
          onSetIsPassphraseValid(false);
        } finally {
          setLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passphrase]);

  return (
    <div
      style={{
        textAlign: 'center'
      }}
    >
      <p
        style={{
          fontWeight: 'bold',
          fontSize: '1.7rem',
          marginBottom: '2.7rem',
          color: Color.darkerGray()
        }}
      >
        Prove you are a Twinkler by answering the question below
      </p>
      <p
        style={{
          fontWeight: 'bold',
          fontSize: '2rem',
          marginBottom: '1rem'
        }}
      >
        {passphraseLabel}
      </p>
      <div
        className={css`
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            min-width: 50%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <div style={{ width: '2.5rem', marginRight: '1rem' }} />
          <Input
            value={passphrase}
            hasError={!!errorMessage}
            placeholder={passphraseLabel}
            style={{ width: '100%' }}
            onChange={(text) => {
              setErrorMessage('');
              onSetPassphrase(text);
            }}
          />
          <div style={{ width: '2.5rem', marginLeft: '1rem' }}>
            {loading && (
              <Icon
                style={{
                  color: Color.gray()
                }}
                icon="spinner"
                pulse
              />
            )}
          </div>
        </div>
      </div>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
}
