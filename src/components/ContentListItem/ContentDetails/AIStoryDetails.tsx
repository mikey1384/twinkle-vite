import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { truncateTopic } from '~/helpers/stringHelpers';

const containerStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const labelStyle = css`
  font-weight: bold;
  margin-bottom: 0.5rem;
  overflow-wrap: break-word;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

const storyStyle = css`
  margin-top: 1rem;
  width: 100%;
  text-align: left;
  color: ${Color.darkerGray()};
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
    line-height: 1.4;
    -webkit-line-clamp: 6;
  }
`;

AIStoryDetails.propTypes = {
  story: PropTypes.string.isRequired,
  topic: PropTypes.string.isRequired
};

export default function AIStoryDetails({
  story,
  topic
}: {
  story: string;
  topic: string;
}) {
  return (
    <div className={containerStyle}>
      <div className={`label ${labelStyle}`}>{truncateTopic(topic)}</div>
      <div className={storyStyle}>{story}</div>
    </div>
  );
}
