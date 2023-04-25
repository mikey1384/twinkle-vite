import React from 'react';
import Button from '~/components/Button';

export default function Options({
  partnerName,
  onSelectOption,
  selectedOption
}: {
  partnerName: string;
  onSelectOption: (v: any) => any;
  selectedOption: string;
}) {
  return (
    <div>
      <Button
        skeuomorphic={selectedOption === 'want'}
        color="logoBlue"
        onClick={() => onSelectOption('want')}
      >
        I want to see what {partnerName} has (Trade)
      </Button>
      <Button
        skeuomorphic={selectedOption === 'offer'}
        style={{ marginTop: '1rem' }}
        color="pink"
        onClick={() => onSelectOption('offer')}
      >
        {`I want to show ${partnerName} what I have`}
      </Button>
      <Button
        skeuomorphic={selectedOption === 'send'}
        style={{ marginTop: '1rem' }}
        color="green"
        onClick={() => onSelectOption('send')}
      >
        {`I want to send ${partnerName} something`}
      </Button>
    </div>
  );
}
