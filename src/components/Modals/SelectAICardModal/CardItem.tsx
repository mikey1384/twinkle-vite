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
        justifyContent: 'space-between',
        flexDirection: 'column',
        padding: '1rem',
        boxShadow: selected ? `0 0 5px ${successColor}` : '',
        border: `1px solid ${Color[selected ? successColor : 'borderGray']()}`,
        borderRadius
      }}
      className={css`
        width: calc((100% - 6rem) / 6);
        min-width: 0;
        @media (max-width: ${mobileMaxWidth}) {
          width: calc((100% - 2.4rem) / 3);
        }
        .card-selection {
          min-height: 40px;
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
          className="card-selection"
          aria-label={`${selected ? 'Remove' : 'Select'} card #${card.id}`}
          aria-pressed={selected}
          uppercase={false}
          color={selected ? successColor : 'black'}
          variant={selected ? 'solid' : 'soft'}
          tone="raised"
          mobilePadding="0.5rem"
          onClick={selected ? onDeselect : onSelect}
        >
          {selected && <Icon icon="check" />}
          <span style={{ marginLeft: selected ? '0.7rem' : 0 }}>
            Select{selected ? 'ed' : ''}
          </span>
        </Button>
      </div>
    </div>
  );
}
