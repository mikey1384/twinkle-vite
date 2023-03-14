import { ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import ZeroPic from './ZeroPic';

export default function Greeting() {
  return (
    <div>
      <div>{ZERO_TWINKLE_ID}</div>
      <ZeroPic />
    </div>
  );
}
