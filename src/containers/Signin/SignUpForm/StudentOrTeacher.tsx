import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function StudentOrTeacher() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Roboto', sans-serif;
      `}
    >
      <div
        className={css`
          font-size: 32px;
          margin-bottom: 20px;
          color: ${Color.black()};
          font-weight: 500;
        `}
      >
        Are you a student or a teacher?
      </div>
      <div>
        <button
          className={css`
            background-color: #6200ea;
            color: #fff;
            border: none;
            padding: 12px 24px;
            margin: 10px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            font-family: 'Roboto', sans-serif;
            font-weight: 700;

            &:hover {
              background-color: #3700b3;
            }
          `}
          onClick={() => console.log('Student selected')}
        >
          Student
        </button>
        <button
          className={css`
            background-color: #6200ea;
            color: #fff;
            border: none;
            padding: 12px 24px;
            margin: 10px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            font-family: 'Roboto', sans-serif;
            font-weight: 700;

            &:hover {
              background-color: #3700b3;
            }
          `}
          onClick={() => console.log('Teacher selected')}
        >
          Teacher
        </button>
      </div>
    </div>
  );
}
