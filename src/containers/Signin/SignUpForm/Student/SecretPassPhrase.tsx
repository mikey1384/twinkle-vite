import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import { useAppContext } from '~/contexts';

const passphraseLabel = localize('passphrase');

export default function SecretPassPhrase({
  onSetIsPassphraseValid
}: {
  onSetIsPassphraseValid: (value: boolean) => void;
}) {
  const verifyPassphrase = useAppContext(
    (v) => v.requestHelpers.verifyPassphrase
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [passphrase, setPassphrase] = useState('');

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
    <section>
      <label>{passphraseLabel}</label>
      <Input
        value={passphrase}
        hasError={!!errorMessage}
        placeholder={passphraseLabel}
        onChange={(text) => {
          setErrorMessage('');
          setPassphrase(text);
        }}
      />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </section>
  );
}
