import { useEffect } from 'react';
import { useAppContext } from '~/contexts';

export default function QuestionEditor() {
  const loadGoogleMissionQuestions = useAppContext(
    (v) => v.requestHelpers.loadGoogleMissionQuestions
  );
  useEffect(() => {
    init();
    async function init() {
      const data = await loadGoogleMissionQuestions();
      console.log(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div>question editor</div>
    </div>
  );
}
