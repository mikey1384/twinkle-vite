import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

export default function Menu() {
  const getZerosReview = useAppContext((v) => v.requestHelpers.getZerosReview);
  return (
    <div>
      <Button skeuomorphic onClick={() => handleButtonClick('easier')}>
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
    console.log(type);
    const data = await getZerosReview(type);
    console.log(data);
  }
}
