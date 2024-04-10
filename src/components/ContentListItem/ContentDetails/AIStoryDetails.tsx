import React from 'react';
import PropTypes from 'prop-types';
import { truncateTopic } from '~/helpers/stringHelpers';

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
    <div>
      <div>{truncateTopic(topic)}</div>
      <div>{story}</div>
    </div>
  );
}
