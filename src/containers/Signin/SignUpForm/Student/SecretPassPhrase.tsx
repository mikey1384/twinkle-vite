import React, { useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';

const passphraseLabel = localize('passphrase');
const passphraseErrorMsgLabel = localize('passphraseErrorMsg');

export default function SecretPassPhrase({
  errorMessage,
  onSetErrorMessage,
  onSubmit,
  submitDisabled
}: {
  errorMessage: string;
  onSetErrorMessage: (errorMessage: string) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
}) {
  const [keyphrase, setKeyphrase] = useState('');
  return (
    <section>
      <label>{passphraseLabel}</label>
      <Input
        value={keyphrase}
        hasError={errorMessage === 'keyphrase'}
        placeholder={passphraseLabel}
        onChange={(text) => {
          onSetErrorMessage('');
          setKeyphrase(text);
        }}
        onKeyPress={(event: any) => {
          if (event.key === 'Enter' && !submitDisabled) {
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
