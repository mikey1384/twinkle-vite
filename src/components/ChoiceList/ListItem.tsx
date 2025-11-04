import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function ListItem({
  answerIndex,
  conditionPassStatus,
  listItem,
  onSelect,
  index,
  allowReselect = false
}: {
  answerIndex: number;
  conditionPassStatus: string;
  listItem: any;
  index: number;
  onSelect: (index: number) => any;
  allowReselect?: boolean;
}) {
  const isSelected = !!listItem.checked;
  const isEvaluated = !!conditionPassStatus;
  const isCorrect = index === answerIndex;
  const isWrongSelection =
    conditionPassStatus === 'fail' && isSelected && !isCorrect;

  const { borderColor, backgroundColor, indicatorColor, indicatorIcon } =
    useMemo(() => {
      if (
        conditionPassStatus === 'pass' ||
        conditionPassStatus === 'complete'
      ) {
        return {
          borderColor: isCorrect ? Color.green(0.6) : 'transparent',
          backgroundColor: isCorrect ? Color.green(0.12) : '#fff',
          indicatorColor: isCorrect ? Color.green() : undefined,
          indicatorIcon: isCorrect ? 'check' : null
        };
      }
      if (conditionPassStatus === 'fail') {
        if (isWrongSelection) {
          return {
            borderColor: Color.rose(0.6),
            backgroundColor: Color.rose(0.12),
            indicatorColor: Color.rose(),
            indicatorIcon: 'times'
          };
        }
        if (!allowReselect && isCorrect) {
          return {
            borderColor: Color.green(0.6),
            backgroundColor: Color.green(0.12),
            indicatorColor: Color.green(),
            indicatorIcon: 'check'
          };
        }
      }
      if (isSelected) {
        return {
          borderColor: Color.logoBlue(0.6),
          backgroundColor: Color.logoBlue(0.08),
          indicatorColor: undefined,
          indicatorIcon: null
        };
      }
      return {
        borderColor: 'rgba(148,163,184,0.12)',
        backgroundColor: '#fff',
        indicatorColor: undefined,
        indicatorIcon: null
      };
    }, [
      allowReselect,
      conditionPassStatus,
      isCorrect,
      isSelected,
      isWrongSelection
    ]);

  const optionLabel = useMemo(() => String.fromCharCode(65 + index), [index]);

  return (
    <button
      className={css`
        width: 100%;
        border: 1.2px solid ${borderColor};
        background: ${backgroundColor};
        border-radius: 16px;
        padding: 1.4rem 1.6rem;
        display: flex;
        align-items: center;
        gap: 1.6rem;
        cursor: ${!isEvaluated || allowReselect ? 'pointer' : 'default'};
        transition: transform 0.12s ease, box-shadow 0.18s ease,
          border-color 0.18s ease, background 0.18s ease;
        box-shadow: none;

        ${isWrongSelection
          ? `@media (hover: hover) and (pointer: fine) { 
                 &:hover { 
                   border-color: ${Color.rose(0.4)}; 
                   background: ${Color.rose(0.12)}; 
                 }
               }`
          : !isEvaluated || allowReselect
          ? `@media (hover: hover) and (pointer: fine) { 
                 &:hover { 
                   border-color: ${Color.logoBlue(0.4)}; 
                   background: ${Color.logoBlue(0.08)}; 
                 }
               }`
          : ''}
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.1rem 1.3rem;
          gap: 1rem;
        }
      `}
      onClick={handleSelect}
      aria-pressed={isSelected}
      type="button"
    >
      <div
        className={css`
          width: 3.6rem;
          height: 3.6rem;
          border-radius: 12px;
          background: ${isCorrect &&
          (conditionPassStatus === 'pass' ||
            conditionPassStatus === 'complete' ||
            (conditionPassStatus === 'fail' && !allowReselect))
            ? Color.green(0.18)
            : isSelected
            ? Color.logoBlue(0.15)
            : 'rgba(148,163,184,0.18)'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: ${isCorrect &&
          (conditionPassStatus === 'pass' ||
            conditionPassStatus === 'complete' ||
            (conditionPassStatus === 'fail' && !allowReselect))
            ? Color.green()
            : isSelected
            ? Color.logoBlue()
            : Color.darkerGray()};
          font-size: 1.5rem;
        `}
      >
        {optionLabel}
      </div>
      <div
        className={css`
          flex: 1;
          text-align: left;
          font-size: 1.6rem;
          color: ${Color.darkerGray()};
          line-height: 1.55;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
        dangerouslySetInnerHTML={{ __html: listItem.label }}
      />
      {indicatorIcon ? (
        <Icon
          icon={indicatorIcon as any}
          style={{ color: indicatorColor, fontSize: '1.8rem' }}
        />
      ) : null}
    </button>
  );

  function handleSelect() {
    if (!allowReselect && conditionPassStatus && conditionPassStatus !== '') {
      return;
    }
    onSelect(index);
  }
}
