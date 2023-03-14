import { ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import ZeroPic from './ZeroPic';
import UsernameText from '~/components/Texts/UsernameText';

export default function Greeting() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <div style={{ width: '7rem' }}>
          <ZeroPic />
        </div>
        <UsernameText
          user={{
            username: 'Zero',
            id: ZERO_TWINKLE_ID
          }}
        />
      </div>
    </div>
  );
}
