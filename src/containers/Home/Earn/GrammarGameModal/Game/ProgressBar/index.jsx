import Bubble from './Bubble';
import './styles.css';

export default function ProgressBar() {
  return (
    <div
      style={{
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      {Array(10)
        .fill()
        .map((_, index) => (
          <Bubble
            key={index}
            style={{ marginLeft: index === 0 ? 0 : '0.5rem' }}
          />
        ))}
    </div>
  );
}
