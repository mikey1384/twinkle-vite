import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import CardThumb from '~/components/CardThumb';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function CardItem({
  card,
  onSetAICardModalCardId,
  onDeselect,
  onSelect,
  selected,
  successColor
}: {
  card: any;
  onSetAICardModalCardId: (v: any) => void;
  onDeselect: () => void;
  onSelect: (v: any) => void;
  selected: boolean;
  successColor: string;
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '1rem',
        boxShadow: selected ? `0 0 5px ${successColor}` : '',
        border: `1px solid ${Color[selected ? successColor : 'borderGray']()}`,
        borderRadius
      }}
      className={css`
        margin: 0.3%;
        width: 16%;
        @media (max-width: ${mobileMaxWidth}) {
          margin: 1%;
          width: 30%;
        }
      `}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <CardThumb
          card={card}
          detailed
          onClick={() => onSetAICardModalCardId(card.id)}
        />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <Button
          color={selected ? successColor : 'black'}
          opacity={0.8}
          skeuomorphic
          mobilePadding="0.5rem"
          onClick={selected ? onDeselect : onSelect}
        >
          <Icon icon="check" />
          <span style={{ marginLeft: '0.7rem' }}>
            Select{selected ? 'ed' : ''}
          </span>
        </Button>
      </div>
    </div>
  );
}
