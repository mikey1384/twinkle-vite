import React from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';

export default function PeopleFilterBar({
  dropdownLabel,
  onSetOrderByText,
  orderByText,
  style
}: {
  dropdownLabel: string;
  onSetOrderByText: (arg0: string) => void;
  orderByText: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className={css`
        border: 1px solid var(--ui-border);
        border-radius: ${wideBorderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          border-right: 0;
          border-left: 0;
        }
      `}
      style={{
        padding: '1rem',
        background: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        height: '100%',
        width: '100%',
        ...style
      }}
    >
      <DropdownButton
        variant="solid"
        tone="flat"
        color="darkerGray"
        icon="caret-down"
        text={orderByText}
        menuProps={[
          {
            label: dropdownLabel,
            onClick: () => onSetOrderByText(dropdownLabel)
          }
        ]}
      />
    </div>
  );
}
