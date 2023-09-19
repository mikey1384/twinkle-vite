import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

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
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      onSetIsPassphraseValid(false);
      if (passphrase) {
        const isMatch = await verifyPassphrase(passphrase);
        if (!isMatch) {
          setErrorMessage('Incorrect passphrase');
          onSetIsPassphraseValid(false);
        } else {
          setErrorMessage('');
          onSetIsPassphraseValid(true);
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
      <Input
        value={passphrase}
        hasError={!!errorMessage}
        placeholder={passphraseLabel}
        className={css`
          min-width: 50%;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
        onChange={(text) => {
          setErrorMessage('');
          onSetPassphrase(text);
        }}
      />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
}
