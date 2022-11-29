import CollectedCards from './CollectedCards';
import Market from './Market';

export default function AICardInfo() {
  return (
    <div style={{ height: '100%' }}>
      <Market />
      <CollectedCards />
    </div>
  );
}
