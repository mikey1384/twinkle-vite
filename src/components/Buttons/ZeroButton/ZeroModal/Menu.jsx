import Button from '~/components/Button';

export default function Menu() {
  return (
    <div>
      <Button skeuomorphic onClick={() => console.log('clicked')}>
        Make it easier to understand
      </Button>
      <Button
        skeuomorphic
        style={{ marginTop: '1rem' }}
        onClick={() => console.log('clicked')}
      >
        Make it sound more natural
      </Button>
      <Button
        skeuomorphic
        style={{ marginTop: '1rem' }}
        onClick={() => console.log('clicked')}
      >
        Check grammar
      </Button>
    </div>
  );
}
