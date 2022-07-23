import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SectionPanel from '~/components/SectionPanel';
import MonthlyXPBarChart from './MonthlyXPBarChart';
import AcquisitionPieChart from './AcquisitionPieChart';
import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';
import { useAppContext } from '~/contexts';

const xpAnalysisLabel = localize('xpAnalysis');

XPAnalysis.propTypes = {
  selectedTheme: PropTypes.string,
  userId: PropTypes.number.isRequired,
  style: PropTypes.object
};

export default function XPAnalysis({ selectedTheme, userId, style }) {
  const loadMonthlyXp = useAppContext((v) => v.requestHelpers.loadMonthlyXp);
  const loadXpAcquisition = useAppContext(
    (v) => v.requestHelpers.loadXpAcquisition
  );
  const [monthlyXPData, setMonthlyXPData] = useState([]);
  const [xpAcquisitionData, setXpAcquisitionData] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    init();

    async function init() {
      if (userId) {
        await Promise.all([handleLoadXpAcquisition(), handleLoadMonthlyXP()]);
        setLoaded(true);
      }
    }
    async function handleLoadXpAcquisition() {
      const data = await loadXpAcquisition(userId);
      setXpAcquisitionData(data);
      return Promise.resolve();
    }
    async function handleLoadMonthlyXP() {
      const data = await loadMonthlyXp(userId);
      setMonthlyXPData(data);
      return Promise.resolve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Achievements/XPAnalysis">
      <SectionPanel
        customColorTheme={selectedTheme}
        title={xpAnalysisLabel}
        loaded={loaded}
        style={style}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent:
              xpAcquisitionData.length > 0 ? 'space-between' : 'center'
          }}
        >
          <MonthlyXPBarChart data={monthlyXPData} colorTheme={selectedTheme} />
          {xpAcquisitionData.length > 0 && (
            <AcquisitionPieChart data={xpAcquisitionData} />
          )}
        </div>
      </SectionPanel>
    </ErrorBoundary>
  );
}
