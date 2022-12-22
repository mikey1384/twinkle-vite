import { Color } from '~/constants/css';

export default function BurnStatus() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        color: Color.darkerGray()
      }}
    >
      <div>This card was burned</div>
    </div>
  );
}
