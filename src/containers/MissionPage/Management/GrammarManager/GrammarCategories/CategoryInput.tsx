import React from 'react';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { stringIsEmpty } from '~/helpers/stringHelpers';

export default function CategoryInput({
  onChange,
  categoryText,
  onSubmit,
  uploading
}: {
  onChange: (event: any) => void;
  categoryText: string;
  onSubmit: () => void;
  uploading: boolean;
}) {
  return (
    <div style={{ display: 'flex' }}>
      <Input
        onChange={onChange}
        placeholder="Enter category..."
        value={categoryText}
        style={{ width: '100%' }}
        onKeyPress={(event: any) => {
          if (
            !uploading &&
            !stringIsEmpty(categoryText) &&
            event.key === 'Enter'
          ) {
            onSubmit();
          }
        }}
      />
      {!stringIsEmpty(categoryText) && (
        <Button
          onClick={onSubmit}
          loading={uploading}
          color="blue"
          variant="solid"
          style={{ marginLeft: '1rem' }}
        >
          <Icon icon="plus" />
        </Button>
      )}
    </div>
  );
}
