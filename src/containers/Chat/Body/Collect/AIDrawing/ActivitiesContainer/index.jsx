import { useChatContext } from '~/contexts';
import Activity from './Activity';

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
      {aiImageRows.map((row) => {
        return <Activity key={row.id} activity={row} />;
      })}
    </div>
  );
}
