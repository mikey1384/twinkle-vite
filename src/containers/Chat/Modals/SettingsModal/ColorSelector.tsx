import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { priceTable } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';

const labels: Record<string, string> = {
  green: 'Green', orange: 'Orange', red: 'Red', rose: 'Rose', pink: 'Pink',
  purple: 'Purple', darkBlue: 'Dark blue', logoBlue: 'Blue'
};

export default function ColorSelector({ unlocked = [], colors, onSetColor, selectedColor, style, disabled = false }: {
  unlocked: string[];
  colors: string[];
  onSetColor: (value: string) => void;
  selectedColor: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const coins = useKeyContext(v => v.myState.twinkleCoins);
  return <div>
    <div className={colorsClass} style={style} role="group" aria-label="Channel color theme">
      {colors.map(color => {
        const locked = !['green', 'logoBlue'].includes(color) && !unlocked.includes(color);
        const cannotAfford = locked && coins < priceTable.chatTheme;
        const label = (labels[color] || color) + ' theme' + (locked ? ', locked, ' + priceTable.chatTheme + ' coins' : '');
        return <button key={color} type="button" aria-label={label} title={label}
          aria-pressed={selectedColor === color} disabled={disabled || cannotAfford}
          onClick={() => onSetColor(color)}>
          <span style={{ background: Color[color]() }} aria-hidden="true">
            <Icon icon={locked ? 'lock' : selectedColor === color ? 'check' : 'circle'} />
          </span>
          <span className="color-label">{labels[color] || color}</span>
        </button>;
      })}
    </div>
    <p className="field-hint">Locked colors cost {priceTable.chatTheme} Twinkle Coins each. You’ll confirm before buying.</p>
  </div>;
}

const colorsClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
  gap: 8px;
  width: 100%;
  button {
    min-width: 0;
    min-height: 76px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border: 1px solid #dce3ed;
    border-radius: 10px;
    background: #fff;
    color: #334155;
    font: inherit;
    cursor: pointer;
  }
  button > span:first-child {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: #fff;
    font-size: 12px;
    text-shadow: 0 1px 2px #0008;
  }
  button[aria-pressed='true'] { border: 2px solid #334155; background: #f1f5f9; padding: 7px; }
  button:hover:not(:disabled) { background: #eef2f7; }
  button:disabled { cursor: default; }
  button:disabled > span:first-child { opacity: .5; }
  .color-label { font-size: 12px; }
`;
