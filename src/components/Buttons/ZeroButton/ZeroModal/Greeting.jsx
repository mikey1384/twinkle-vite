import { ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import zeroFull from './zero-full.png';

export default function Greeting() {
  return (
    <div>
      <img src={zeroFull} alt="Zero" />
      <div>{ZERO_TWINKLE_ID}</div>
    </div>
  );
}
