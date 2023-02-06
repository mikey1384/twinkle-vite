import { useEffect } from 'react';
import PropTypes from 'prop-types';

Filtered.propTypes = {
  color: PropTypes.string,
  quality: PropTypes.string
};

export default function Filtered({ color, quality }) {
  useEffect(() => {
    console.log(color, quality);
  }, [color, quality]);

  return (
    <div>
      <div>this is filtered</div>
    </div>
  );
}
