import React, { useEffect } from 'react';
import InvalidPage from '~/components/InvalidPage';
import FilterBar from '~/components/FilterBar';
import ManagementRoutes from './Routes';
import Loading from '~/components/Loading';
import SideMenu from '~/components/SideMenu';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  ADMIN_MANAGEMENT_LEVEL,
  ADMIN_USER_ID
} from '~/constants/defaultValues';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useManagementContext, useKeyContext } from '~/contexts';

export default function Management() {
  const location = useLocation();
  const navigate = useNavigate();
  const loaded = useManagementContext((v) => v.state.loaded);
  const onLoadManagement = useManagementContext(
    (v) => v.actions.onLoadManagement
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const canViewAiCosts = managementLevel >= ADMIN_MANAGEMENT_LEVEL;
  const canViewNotableUsers = managementLevel >= ADMIN_MANAGEMENT_LEVEL;
  const canViewPayment = userId === ADMIN_USER_ID;
  const canViewHomeFeedPerformance = userId === ADMIN_USER_ID;

  useEffect(() => {
    onLoadManagement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managementLevel]);

  return !loaded ? (
    <Loading />
  ) : managementLevel > 0 ? (
    <div>
      <SideMenu
        variant="card"
        topOffset="50%"
        style={{ transform: 'translateY(-50%)' }}
      >
        <NavLink
          to="/management"
          end
          className={(navData) => (navData.isActive ? 'active' : '')}
        >
          <Icon icon="users" />
          <span style={{ marginLeft: '1.1rem' }}>Accounts</span>
        </NavLink>
        <NavLink
          to="/management/tools"
          end
          className={(navData) => (navData.isActive ? 'active' : '')}
        >
          <Icon icon="sliders-h" />
          <span style={{ marginLeft: '1.1rem' }}>Tools</span>
        </NavLink>
        <NavLink
          to="/management/mod-activities"
          className={(navData) => (navData.isActive ? 'active' : '')}
        >
          <Icon icon="clipboard-check" />
          <span style={{ marginLeft: '1.1rem' }}>Moderation</span>
        </NavLink>
        {canViewNotableUsers && (
          <NavLink
            to="/management/notable-users"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="star" />
            <span style={{ marginLeft: '1.1rem' }}>Notable Users</span>
          </NavLink>
        )}
        {canViewAiCosts && (
          <NavLink
            to="/management/ai-costs"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="chart-line" />
            <span style={{ marginLeft: '1.1rem' }}>AI Costs</span>
          </NavLink>
        )}
        {canViewPayment && (
          <NavLink
            to="/management/payment"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="badge-dollar" />
            <span style={{ marginLeft: '1.1rem' }}>Payment</span>
          </NavLink>
        )}
        {canViewHomeFeedPerformance && (
          <NavLink
            to="/management/home-feed-performance"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="chart-line" />
            <span style={{ marginLeft: '1.1rem' }}>Home Feed Performance</span>
          </NavLink>
        )}
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
          Account Mgmt
        </nav>
        <nav
          className={location.pathname === `/management/tools` ? 'active' : ''}
          onClick={() => navigate('/management/tools')}
        >
          Tools
        </nav>
        <nav
          className={
            location.pathname === `/management/mod-activities` ? 'active' : ''
          }
          onClick={() => navigate('/management/mod-activities')}
        >
          Mod Activities
        </nav>
        {canViewNotableUsers && (
          <nav
            className={
              location.pathname === `/management/notable-users` ? 'active' : ''
            }
            onClick={() => navigate('/management/notable-users')}
          >
            Notable Users
          </nav>
        )}
        {canViewAiCosts && (
          <nav
            className={
              location.pathname === `/management/ai-costs` ? 'active' : ''
            }
            onClick={() => navigate('/management/ai-costs')}
          >
            AI Costs
          </nav>
        )}
        {canViewPayment && (
          <nav
            className={
              location.pathname === `/management/payment` ? 'active' : ''
            }
            onClick={() => navigate('/management/payment')}
          >
            Payment
          </nav>
        )}
        {canViewHomeFeedPerformance && (
          <nav
            className={
              location.pathname === `/management/home-feed-performance`
                ? 'active'
                : ''
            }
            onClick={() => navigate('/management/home-feed-performance')}
          >
            Feed Perf
          </nav>
        )}
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
      text="This page is only available to users with admin privileges"
    />
  );
}
