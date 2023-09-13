import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

export default function StudentOrTeacher({
  onSelect
}: {
  onSelect: (userType: 'student' | 'teacher') => void;
}) {
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
          font-size: 3rem;
          margin-bottom: 20px;
          color: #333333;
          font-weight: 500;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 2.5rem;
          }
        `}
      >
        Are you a student or a teacher?
      </div>
      <div>
        <button
          className={css`
            background-color: #0088ee;
            color: #fff;
            border: none;
            padding: 12px 24px;
            margin: 10px;
            font-size: 2rem;
            border-radius: ${borderRadius};
            cursor: pointer;
            transition: background-color 0.3s ease;
            font-family: 'Roboto', sans-serif;
            font-weight: 700;

            &:hover {
              background-color: #0066bb;
            }
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
          onClick={() => onSelect('student')}
        >
          Student
        </button>
        <button
          className={css`
            background-color: #ff7a59;
            color: #fff;
            border: none;
            padding: 12px 24px;
            margin: 10px;
            font-size: 2rem;
            border-radius: ${borderRadius};
            cursor: pointer;
            transition: background-color 0.3s ease;
            font-family: 'Roboto', sans-serif;
            font-weight: 700;

            &:hover {
              background-color: #cc6044;
            }

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
          onClick={() => onSelect('teacher')}
        >
          Teacher
        </button>
      </div>
    </div>
  );
}
