import React from 'react';
import PropTypes from 'prop-types';
import Embedly from '~/components/Embedly';

UrlDetails.propTypes = {
  contentId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired
};
export default function UrlDetails({
  contentId,
  title
}: {
  contentId: number;
  title: string;
}) {
  return (
    <div>
      <span>{title}</span>
      <Embedly
        small
        noLink
        style={{ marginTop: '0.5rem' }}
        contentId={contentId}
      />
    </div>
  );
}
