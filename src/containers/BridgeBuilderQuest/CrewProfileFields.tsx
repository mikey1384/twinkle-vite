import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import CrewCover from './CrewCover';
import { CREW_COVERS } from './covers';
import { questHelpClass, questInputClass, questLabelClass } from './StepCard';

export const CREW_NAME_MAX = 30;
export const CREW_ABOUT_MAX = 280;

// Name, cover and "about": create-crew and the founder's Manage panel.
export default function CrewProfileFields({
  idPrefix,
  name,
  about,
  cover,
  onNameChange,
  onAboutChange,
  onCoverChange
}: {
  idPrefix: string;
  name: string;
  about: string;
  cover: string;
  onNameChange: (value: string) => void;
  onAboutChange: (value: string) => void;
  onCoverChange: (value: string) => void;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      `}
    >
      <div>
        <label className={questLabelClass} htmlFor={`${idPrefix}-name`}>
          Crew name <span style={{ fontWeight: 'normal' }}>(optional)</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          className={questInputClass}
          value={name}
          maxLength={CREW_NAME_MAX}
          placeholder="For example: Star Makers"
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
      <div>
        <span className={questLabelClass}>Cover</span>
        <div
          role="radiogroup"
          aria-label="Crew cover"
          className={css`
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.6rem;
          `}
        >
          {CREW_COVERS.map((preset) => {
            const selected = preset.key === cover;
            return (
              <button
                key={preset.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.label}
                onClick={() => onCoverChange(preset.key)}
                className={css`
                  position: relative;
                  padding: 0;
                  border: 3px solid ${selected ? Color.black() : 'transparent'};
                  border-radius: 1rem;
                  background: none;
                  cursor: pointer;
                  transition: transform 0.15s ease;
                  &:hover {
                    transform: translateY(-2px);
                  }
                `}
              >
                <CrewCover cover={preset.key} height="4.6rem" rounded="0.7rem" />
                {selected && (
                  <span
                    className={css`
                      position: absolute;
                      right: 0.4rem;
                      bottom: 0.3rem;
                      color: #fff;
                      font-size: 1.4rem;
                    `}
                  >
                    <Icon icon="check-circle" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className={questLabelClass} htmlFor={`${idPrefix}-about`}>
          About your crew <span style={{ fontWeight: 'normal' }}>(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-about`}
          className={questInputClass}
          rows={3}
          maxLength={CREW_ABOUT_MAX}
          value={about}
          placeholder="What do you like doing? What kind of friends are you looking for?"
          onChange={(event) => onAboutChange(event.target.value)}
        />
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            gap: 1rem;
          `}
        >
          <span className={questHelpClass}>
            Everyone on Twinkle can read this. No addresses, phone numbers or
            meeting spots.
          </span>
          <span className={questHelpClass}>
            {about.length}/{CREW_ABOUT_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}
