import { useChatContext } from '~/contexts';

export default function ActivitiesContainer() {
  const aiImageRows = useChatContext((v) => v.state.aiImages);
  return (
    <div
      style={{
        zIndex: 5,
        width: '100%',
        height: 'CALC(100% - 6.5rem)',
        overflow: 'scroll'
      }}
    >
      {aiImageRows.map((row) => (
        <img key={row.id} style={{ width: '50%' }} src={row.images[0]} />
      ))}
    </div>
  );
}
