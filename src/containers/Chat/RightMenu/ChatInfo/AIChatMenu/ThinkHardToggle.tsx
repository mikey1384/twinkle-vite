import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

export default function ThinkHardToggle() {
  const [thinkHard, setThinkHard] = useState(false);

  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 0;
        width: 100%;
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          width: 100%;
        `}
      >
        <h3
          className={css`
            font-size: 1.4rem;
            color: #333;
            margin: 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          `}
        >
          <Icon icon="lightbulb" />
          Think Hard
        </h3>
        <label
          className={css`
            position: relative;
            display: inline-block;
            width: 54px;
            height: 28px;
            cursor: pointer;
          `}
        >
          <input
            type="checkbox"
            checked={thinkHard}
            onChange={(e) => setThinkHard(e.target.checked)}
            className={css`
              opacity: 0;
              width: 0;
              height: 0;
            `}
          />
          <span
            className={css`
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: ${thinkHard ? '#00aa00' : '#ddd'};
              transition: all 0.3s ease;
              border-radius: 28px;
              box-shadow: ${thinkHard 
                ? '0 2px 6px rgba(0, 170, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.1)'};
              
              &:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: ${thinkHard ? '29px' : '3px'};
                bottom: 3px;
                background-color: white;
                transition: all 0.3s ease;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              
              &:hover {
                background-color: ${thinkHard ? '#00bb00' : '#ccc'};
              }
            `}
          />
        </label>
        <p
          className={css`
            font-size: 0.8rem;
            color: #666;
            margin: 0;
            text-align: center;
            line-height: 1.3;
          `}
        >
          {thinkHard 
            ? 'Enhanced reasoning active (500 coins/message)' 
            : 'Enhanced reasoning mode (500 coins/message)'}
        </p>
      </div>
    </div>
  );
}