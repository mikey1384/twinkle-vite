import React, { useEffect } from 'react';
import InvalidPage from '~/components/InvalidPage';
import FilterBar from '~/components/FilterBar';
import ManagementRoutes from './ManagementRoutes';
import Loading from '~/components/Loading';
import SideMenu from '~/components/SideMenu';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useManagementContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const accountMgmtLabel = localize('accountMgmt');
const modActivitiesLabel = localize('modActivities');

export default function Management() {
  const location = useLocation();
  const navigate = useNavigate();
  const loaded = useManagementContext((v) => v.state.loaded);
  const onLoadManagement = useManagementContext(
    (v) => v.actions.onLoadManagement
  );
  const { userId, managementLevel } = useKeyContext((v) => v.myState);
  useEffect(() => {
    onLoadManagement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managementLevel]);

  return !loaded ? (
    <Loading />
  ) : managementLevel > 0 ? (
    <div>
      <SideMenu style={{ top: 'CALC(50vh - 8rem)' }}>
        <NavLink
          to="/management"
          end
          className={(navData) => (navData.isActive ? 'active' : '')}
        >
          <span style={{ marginLeft: '1.1rem' }}>{accountMgmtLabel}</span>
        </NavLink>
        <NavLink
          to="/management/mod-activities"
          className={(navData) => (navData.isActive ? 'active' : '')}
        >
          <span style={{ marginLeft: '1.1rem' }}>{modActivitiesLabel}</span>
        </NavLink>
      </SideMenu>
      <FilterBar
        style={{ height: '5rem', marginBottom: 0 }}
        className={`mobile ${css`
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.3rem;
          }
        `}`}
      >
        <nav
          className={location.pathname === `/management` ? 'active' : ''}
          onClick={() => navigate('/management')}
        >
          {accountMgmtLabel}
        </nav>
        <nav
          className={
            location.pathname === `/management/mod-activities` ? 'active' : ''
          }
          onClick={() => navigate('/management/mod-activities')}
        >
          {modActivitiesLabel}
        </nav>
      </FilterBar>
      <ManagementRoutes
        className={css`
          width: CALC(100vw - 51rem - 2rem);
          margin-left: 20rem;
          display: flex;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
            margin-top: 0;
            margin-left: 0;
            margin-right: 0;
          }
        `}
      />
    </div>
  ) : (
    <InvalidPage
      title={userId ? 'For authorized moderators only' : 'Please log in'}
      text={
        userId
          ? 'You are not authorized to view this page'
          : 'This page is only available to logged in users'
      }
    />
  );
}
