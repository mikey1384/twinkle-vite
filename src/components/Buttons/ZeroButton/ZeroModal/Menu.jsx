import PropTypes from 'prop-types';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

Menu.propTypes = {
  content: PropTypes.string.isRequired
};

export default function Menu({ content }) {
  const getZerosReview = useAppContext((v) => v.requestHelpers.getZerosReview);
  return (
    <div>
      <Button skeuomorphic onClick={() => handleButtonClick('easy')}>
        Make it easier to understand
      </Button>
      <Button
        skeuomorphic
        style={{ marginTop: '1rem' }}
        onClick={() => handleButtonClick('natural')}
      >
        Make it sound more natural
      </Button>
      <Button
        skeuomorphic
        style={{ marginTop: '1rem' }}
        onClick={() => handleButtonClick('grammar')}
      >
        Check grammar
      </Button>
    </div>
  );

  async function handleButtonClick(type) {
    const data = await getZerosReview({ type, content });
    console.log(data);
  }
}
