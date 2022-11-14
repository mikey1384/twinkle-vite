import { useChatContext } from '~/contexts';
import { cloudFrontURL } from '~/constants/defaultValues';

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
        https: return (
          <img
            key={row.id}
            style={{ width: '70%' }}
            src={`${cloudFrontURL}${row.images[0]}`}
          />
        );
      })}
    </div>
  );
}
