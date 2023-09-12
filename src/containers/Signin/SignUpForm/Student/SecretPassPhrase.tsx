import React, { useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';

const passphraseLabel = localize('passphrase');
const passphraseErrorMsgLabel = localize('passphraseErrorMsg');

export default function SecretPassPhrase({
  onSubmit
}: {
  onSubmit: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [keyphrase, setKeyphrase] = useState('');
  return (
    <section>
      <label>{passphraseLabel}</label>
      <Input
        value={keyphrase}
        hasError={errorMessage === 'keyphrase'}
        placeholder={passphraseLabel}
        onChange={(text) => {
          setErrorMessage('');
          setKeyphrase(text);
        }}
        onKeyPress={(event: any) => {
          if (event.key === 'Enter') {
            onSubmit();
          }
        }}
      />
      {errorMessage === 'keyphrase' && (
        <p style={{ color: 'red' }}>{passphraseErrorMsgLabel}</p>
      )}
    </section>
  );
}
