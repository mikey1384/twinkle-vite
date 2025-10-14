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
        variant={selectedOption === 'want' ? 'soft' : 'solid'}
        tone={selectedOption === 'want' ? 'raised' : undefined}
        color="logoBlue"
        onClick={() => onSelectOption('want')}
      >
        I want to see what {partnerName} has (Trade)
      </Button>
      <Button
        variant={selectedOption === 'offer' ? 'soft' : 'solid'}
        tone={selectedOption === 'offer' ? 'raised' : undefined}
        style={{ marginTop: '1rem' }}
        color="pink"
        onClick={() => onSelectOption('offer')}
      >
        {`I want to show ${partnerName} what I have`}
      </Button>
      <Button
        variant={selectedOption === 'send' ? 'soft' : 'solid'}
        tone={selectedOption === 'send' ? 'raised' : undefined}
        style={{ marginTop: '1rem' }}
        color="green"
        onClick={() => onSelectOption('send')}
      >
        {`I want to send ${partnerName} something`}
      </Button>
    </div>
  );
}
