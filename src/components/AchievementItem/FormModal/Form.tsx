import React from 'react';
import { borderRadius, Color } from '~/constants/css';
import { css } from '@emotion/css';
import Textarea from '~/components/Texts/Textarea';

export default function Form({
  label,
  value,
  type,
  onChange
}: {
  label: string;
  value: string;
  type: 'date' | 'text' | 'checkbox';
  onChange: (value: string) => void;
}) {
  const inputStyle = css`
    padding: 0.5rem;
    font-size: 1.3rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: ${borderRadius};
    outline: 2px solid transparent;
    transition: outline-color 0.3s ease;
    &:focus {
      outline-color: ${Color.white()};
    }
    ${type === 'date' &&
    `
      &::-webkit-datetime-edit-year-field:focus,
      &::-webkit-datetime-edit-month-field:focus,
      &::-webkit-datetime-edit-day-field:focus {
        background-color: ${Color.lightGray()};
        color: ${Color.black()};
      }
      &::-moz-selection {
        background-color: ${Color.lightGray()};
        color: ${Color.black()};
      }
      &::selection {
        background-color: ${Color.lightGray()};
        color: ${Color.black()};
      }
    `}
  `;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <label
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: Color.black()
        }}
      >
        {label}
      </label>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {type === 'text' ? (
          <Textarea
            value={value}
            placeholder={label}
            onChange={(event: any) => onChange(event.target.value)}
            style={{ width: '100%' }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputStyle}
          />
        )}
      </div>
    </div>
  );
}
