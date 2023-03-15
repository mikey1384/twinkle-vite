import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

Menu.propTypes = {
  content: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default function Menu({ content, style }) {
  const getZerosReview = useAppContext((v) => v.requestHelpers.getZerosReview);
  const [loadingType, setLoadingType] = useState(null);
  return (
    <div style={style}>
      <Button
        skeuomorphic
        loading={loadingType === 'easy'}
        onClick={() => handleButtonClick('easy')}
      >
        Make it easier to understand
      </Button>
      <Button
        skeuomorphic
        loading={loadingType === 'natural'}
        style={{ marginTop: '1rem' }}
        onClick={() => handleButtonClick('natural')}
      >
        Rewrite this in your own way
      </Button>
      <Button
        skeuomorphic
        loading={loadingType === 'grammar'}
        style={{ marginTop: '1rem' }}
        onClick={() => handleButtonClick('grammar')}
      >
        Check grammar
      </Button>
    </div>
  );

  async function handleButtonClick(type) {
    setLoadingType(type);
    const data = await getZerosReview({ type, content });
    console.log(data);
    setLoadingType(null);
  }
}
