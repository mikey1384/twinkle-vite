import React from 'react';
import PropTypes from 'prop-types';
import Embedly from '~/components/Embedly';

UrlDetails.propTypes = {
  contentId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired
};
export default function UrlDetails({
  contentId,
  title,
  thumbUrl,
  actualTitle,
  actualDescription
}: {
  contentId: number;
  title: string;
  thumbUrl: string;
  actualTitle: string;
  actualDescription: string;
}) {
  return (
    <>
      <div
        className="title"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <p>{title}</p>
      </div>
      <div className="description" style={{ height: '100%' }}>
        <Embedly
          small
          noLink
          contentId={contentId}
          defaultThumbUrl={thumbUrl}
          defaultActualTitle={actualTitle}
          defaultActualDescription={actualDescription}
        />
      </div>
    </>
  );
}
