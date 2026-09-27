import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';

// Shown instead of the sign-up question when this browser holds an invite
// pass (signupPasses.ts): who invited you, why you can skip the question, and
// that the email still has to be verified.
export default function InvitePass({
  inviterName,
  source,
  minecraftName,
  onContinue,
  onUseQuestion,
  onLogIn
}: {
  inviterName: string;
  source: 'guest' | 'minecraft';
  minecraftName?: string;
  onContinue: () => void;
  onUseQuestion: () => void;
  // already on Twinkle: log in, then link the Minecraft player instead
  onLogIn?: () => void;
}) {
  const fromMinecraft = source === 'minecraft';
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.2rem;
      `}
    >
      <div
        className={css`
          font-size: 2.6rem;
          font-weight: 700;
          color: ${Color.darkerGray()};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 2rem;
          }
        `}
      >
        {fromMinecraft
          ? `${inviterName || 'A moderator'} vouched for you`
          : `${inviterName} invited you`}
      </div>
      <p
        className={css`
          max-width: 46rem;
          margin: 0;
          font-size: 1.6rem;
          line-height: 1.5;
          color: ${Color.darkGray()};
        `}
      >
        {fromMinecraft
          ? `You were vouched for as a builder on our Minecraft server${
              minecraftName ? ` (as ${minecraftName})` : ''
            }, so you can join ${SITE_NAME} without the sign-up question. Your new account links to that Minecraft account by itself.`
          : `You played with ${inviterName} in a private room for 10 minutes, so you can join ${SITE_NAME} without the sign-up question.`}
      </p>
      <p
        className={css`
          max-width: 46rem;
          margin: 0;
          font-size: 1.4rem;
          color: ${Color.darkGray()};
        `}
      >
        You'll still verify your email with a code we send you. This invite
        makes one account.
      </p>
      <button
        type="button"
        autoFocus
        onClick={onContinue}
        className={css`
          margin-top: 0.8rem;
          background-color: #0088ee;
          color: #fff;
          border: none;
          padding: 12px 28px;
          font-size: 1.9rem;
          font-weight: 700;
          border-radius: ${borderRadius};
          cursor: pointer;
          &:hover,
          &:focus-visible {
            background-color: #0066bb;
          }
          &:focus-visible {
            outline: 3px solid #99ccff;
            outline-offset: 2px;
          }
        `}
      >
        Continue
      </button>
      {fromMinecraft && onLogIn && (
        <p
          className={css`
            max-width: 46rem;
            margin: 0.4rem 0 0;
            padding: 1rem 1.4rem;
            border-radius: ${borderRadius};
            background: ${Color.highlightGray()};
            font-size: 1.4rem;
            line-height: 1.5;
            color: ${Color.darkerGray()};
          `}
        >
          <b>Already on {SITE_NAME}?</b> Don't make a second account.{' '}
          <button
            type="button"
            onClick={onLogIn}
            className={css`
              padding: 0;
              background: none;
              border: none;
              color: #0077cc;
              font: inherit;
              font-weight: 700;
              text-decoration: underline;
              cursor: pointer;
            `}
          >
            Log in instead
          </button>{' '}
          and link {minecraftName || 'your Minecraft account'} to it.
        </p>
      )}
      <button
        type="button"
        onClick={onUseQuestion}
        className={css`
          background: none;
          border: none;
          color: ${Color.darkGray()};
          font-size: 1.3rem;
          text-decoration: underline;
          cursor: pointer;
        `}
      >
        Answer the sign-up question instead
      </button>
    </div>
  );
}
