import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import { useAppContext, useKeyContext } from '~/contexts';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { displayFontFamily } from './styles';

export default function NewBuild() {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const createBuild = useAppContext((v) => v.requestHelpers.createBuild);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');

  if (!userId) {
    return <InvalidPage text="Please log in to create a build" />;
  }

  async function handleCreate() {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const { build } = await createBuild({
        title: title.trim()
      });
      if (build?.id) {
        navigate(`/build/${build.id}`, {
          replace: true,
          state: { seedGreeting: true }
        });
      }
    } catch (error) {
      console.error('Failed to create build:', error);
      setCreating(false);
    }
  }

  function handleBack() {
    navigate('/build');
  }

  return (
    <div
      className={css`
        width: 100%;
        max-width: 720px;
        margin: 3rem auto;
        padding: 0 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem;
        }
      `}
    >
      <div
        className={css`
          position: relative;
          padding: 2.2rem;
          border-radius: 22px;
          background: #fff;
          border: 1px solid var(--ui-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.6rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
          `}
        >
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.6rem;
              padding: 0.45rem 1rem;
              border-radius: 999px;
              background: rgba(65, 140, 235, 0.14);
              color: #1d4ed8;
              border: 1px solid rgba(65, 140, 235, 0.28);
              font-weight: 900;
              font-size: 1.1rem;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              font-family: ${displayFontFamily};
            `}
          >
            <Icon icon="sparkles" />
            New Build
          </span>
          <h1
            className={css`
              margin: 0;
              font-size: 2.8rem;
              font-weight: 900;
              line-height: 1.1;
              color: var(--chat-text);
              font-family: ${displayFontFamily};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2.3rem;
              }
            `}
          >
            Create a New Build
          </h1>
          <p
            className={css`
              margin: 0;
              font-size: 1.18rem;
              color: var(--chat-text);
              opacity: 0.8;
              max-width: 34rem;
              line-height: 1.6;
            `}
          >
            Give your project a name so Build Studio can start scaffolding your
            app.
          </p>
        </div>
      </div>
      <div
        className={css`
          margin-top: 1.8rem;
          background: #fff;
          border-radius: ${borderRadius};
          border: 1px solid var(--ui-border);
          padding: 1.6rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        `}
      >
        <label
          htmlFor="build-title"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 700,
            color: 'var(--chat-text)'
          }}
        >
          Title
        </label>
        <input
          id="build-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="My awesome app"
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleCreate();
          }}
          className={css`
            width: 100%;
            padding: 0.9rem 1rem;
            font-size: 1.1rem;
            border: 1px solid rgba(65, 140, 235, 0.26);
            border-radius: ${borderRadius};
            background: #fff;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
            &:focus {
              outline: none;
              border-color: #418ceb;
              box-shadow: 0 0 0 2px rgba(65, 140, 235, 0.12);
            }
          `}
        />
        <div
          className={css`
            margin-top: 1.4rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          `}
        >
          <GameCTAButton
            variant="neutral"
            size="lg"
            icon="arrow-left"
            onClick={handleBack}
          >
            Build Studio
          </GameCTAButton>
          <GameCTAButton
            variant="primary"
            size="lg"
            shiny
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            loading={creating}
          >
            {creating ? 'Creating...' : 'Create Build'}
          </GameCTAButton>
        </div>
      </div>
    </div>
  );
}
