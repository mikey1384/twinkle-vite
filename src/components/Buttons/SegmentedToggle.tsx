import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

interface SegmentedToggleOption<Value extends string> {
  value: Value;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface SegmentedToggleProps<Value extends string> {
  value: Value;
  options: ReadonlyArray<SegmentedToggleOption<Value>>;
  onChange: (value: Value) => void;
  ariaLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

export default function SegmentedToggle<Value extends string>({
  value,
  options,
  onChange,
  ariaLabel = 'Segmented toggle',
  disabled = false,
  size = 'md',
  style,
  className
}: SegmentedToggleProps<Value>) {
  const rootClass = getRootClass({ optionCount: options.length, size, disabled });

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={className ? `${rootClass} ${className}` : rootClass}
      style={style}
    >
      {options.map((option) => {
        const selected = value === option.value;
        const optionDisabled = disabled || Boolean(option.disabled);
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-label={option.label}
            tabIndex={selected ? 0 : -1}
            disabled={optionDisabled}
            className={getOptionClass({ selected, size })}
            onClick={() => handleOptionClick(optionDisabled, option.value, onChange)}
          >
            {option.icon ? <Icon icon={option.icon} /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function getRootClass({
  optionCount,
  size,
  disabled
}: {
  optionCount: number;
  size: 'sm' | 'md';
  disabled: boolean;
}) {
  const safeCount = Math.max(1, optionCount);
  const minHeight = size === 'sm' ? '2.6rem' : '3rem';
  const minColumnWidth = size === 'sm' ? '6.1rem' : '6.8rem';
  return css`
    display: inline-grid;
    grid-template-columns: repeat(${safeCount}, minmax(${minColumnWidth}, 1fr));
    align-items: stretch;
    gap: 0.25rem;
    min-height: ${minHeight};
    padding: 0.25rem;
    border-radius: 999px;
    border: none;
    background: #eaf0f7;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
    ${disabled ? 'opacity: 0.65;' : ''}
  `;
}

function getOptionClass({
  selected,
  size
}: {
  selected: boolean;
  size: 'sm' | 'md';
}) {
  const fontSize = size === 'sm' ? '0.86rem' : '0.92rem';
  const padding = size === 'sm' ? '0.4rem 0.68rem' : '0.45rem 0.75rem';
  const activeBackground = 'linear-gradient(180deg, #5aa3fb 0%, #418CEB 100%)';
  const inactiveBackground = '#ffffff';
  const activeBorder = '#0046C3';
  const inactiveBorder = '#c9d4e3';
  const inactiveShadow = '#bcc7d7';
  const restingShadow = selected ? 'none' : `0 2px 0 ${inactiveShadow}`;
  const restingTransform = selected ? 'translateY(2px)' : 'translateY(0)';
  const hoverShadow = selected ? 'none' : `0 1px 0 ${inactiveShadow}`;
  const hoverTransform = selected ? 'translateY(2px)' : 'translateY(1px)';

  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    width: 100%;
    min-height: 100%;
    padding: ${padding};
    border-radius: 999px;
    border: 2px solid ${selected ? activeBorder : inactiveBorder};
    background: ${selected ? activeBackground : inactiveBackground};
    color: ${selected ? '#ffffff' : '#334155'};
    box-shadow: ${restingShadow};
    transform: ${restingTransform};
    font-size: ${fontSize};
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      background 0.15s ease;

    &:hover:not(:disabled) {
      transform: ${hoverTransform};
      box-shadow: ${hoverShadow};
    }

    &:active:not(:disabled) {
      transform: translateY(2px);
      box-shadow: none;
    }

    &:focus-visible {
      outline: 2px solid rgba(65, 140, 235, 0.45);
      outline-offset: 1px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
      transform: none;
      box-shadow: none;
    }
  `;
}

function handleOptionClick<Value extends string>(
  disabled: boolean,
  optionValue: Value,
  onChange: (value: Value) => void
) {
  if (disabled) return;
  onChange(optionValue);
}
