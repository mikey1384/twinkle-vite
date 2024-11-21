import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Table from '../Table';
import { useAppContext, useKeyContext, useManagementContext } from '~/contexts';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';

const userLabel = localize('user');

export default function WealthData() {
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
  const users = useManagementContext((v) => v.state.wealthData);
  const usersLoaded = useManagementContext((v) => v.state.wealthDataLoaded);
  const loadWealthDataCSV = useAppContext(
    (v) => v.requestHelpers.loadWealthDataCSV
  );

  return (
    <ErrorBoundary componentPath="Management/Main/WealthData">
      <SectionPanel
        title="User Wealth Data"
        isEmpty={users.length === 0}
        emptyMessage="No data available"
        loaded={usersLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          <Button color="darkerGray" skeuomorphic onClick={handleDownloadCSV}>
            <Icon icon="file-csv" />
          </Button>
        }
      >
        <Table
          color={tableHeaderColor}
          columns="minmax(15rem, 1.5fr) minmax(15rem, 1.5fr) repeat(25, minmax(10rem, 1fr))"
          style={{
            tableLayout: 'fixed',
            width: '100%'
          }}
        >
          <thead>
            <tr>
              <th>{userLabel}</th>
              <th>Twinkle Coins</th>
              <th>Common Blue</th>
              <th>Common Pink</th>
              <th>Common Orange</th>
              <th>Common Magenta</th>
              <th>Common Gold</th>
              <th>Superior Blue</th>
              <th>Superior Pink</th>
              <th>Superior Orange</th>
              <th>Superior Magenta</th>
              <th>Superior Gold</th>
              <th>Rare Blue</th>
              <th>Rare Pink</th>
              <th>Rare Orange</th>
              <th>Rare Magenta</th>
              <th>Rare Gold</th>
              <th>Elite Blue</th>
              <th>Elite Pink</th>
              <th>Elite Orange</th>
              <th>Elite Magenta</th>
              <th>Elite Gold</th>
              <th>Legendary Blue</th>
              <th>Legendary Pink</th>
              <th>Legendary Orange</th>
              <th>Legendary Magenta</th>
              <th>Legendary Gold</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.username}>
                <td style={{ fontWeight: 'bold' }}>{user.username}</td>
                <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                  {user.twinkleCoins.toLocaleString()}
                </td>
                <td>{user.commonBlueCard}</td>
                <td>{user.commonPinkCard}</td>
                <td>{user.commonOrangeCard}</td>
                <td>{user.commonMagentaCard}</td>
                <td>{user.commonGoldCard}</td>
                <td>{user.superiorBlueCard}</td>
                <td>{user.superiorPinkCard}</td>
                <td>{user.superiorOrangeCard}</td>
                <td>{user.superiorMagentaCard}</td>
                <td>{user.superiorGoldCard}</td>
                <td>{user.rareBlueCard}</td>
                <td>{user.rarePinkCard}</td>
                <td>{user.rareOrangeCard}</td>
                <td>{user.rareMagentaCard}</td>
                <td>{user.rareGoldCard}</td>
                <td>{user.eliteBlueCard}</td>
                <td>{user.elitePinkCard}</td>
                <td>{user.eliteOrangeCard}</td>
                <td>{user.eliteMagentaCard}</td>
                <td>{user.eliteGoldCard}</td>
                <td>{user.legendaryBlueCard}</td>
                <td>{user.legendaryPinkCard}</td>
                <td>{user.legendaryOrangeCard}</td>
                <td>{user.legendaryMagentaCard}</td>
                <td>{user.legendaryGoldCard}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            transparent
            color={tableHeaderColor}
            onClick={handleDownloadCSV}
          >
            Download CSV
          </Button>
        </div>
      </SectionPanel>
    </ErrorBoundary>
  );

  async function handleDownloadCSV() {
    try {
      const response = await loadWealthDataCSV();
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user-wealth.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  }
}
