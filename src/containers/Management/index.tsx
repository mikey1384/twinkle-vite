import React, { useEffect, useRef } from 'react';
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
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';

export default function Management() {
  const location = useLocation();
  const navigate = useNavigate();
  const managementContentRef = useRef<HTMLDivElement | null>(null);
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
  const canViewScrollDiagnostics = userId === ADMIN_USER_ID;
  const canViewBuildWorlds = userId === ADMIN_USER_ID;
  const canViewAiCardImage = userId === ADMIN_USER_ID;

  useEffect(() => {
    onLoadManagement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managementLevel]);

  useScrollAnchorRestoration({
    anchorKey: `management:${location.pathname}`,
    containerRef: managementContentRef,
    initialScroll: { type: 'top' },
    itemsReady: loaded && managementLevel > 0
  });

  return !loaded ? (
    <Loading />
  ) : managementLevel > 0 ? (
    <div ref={managementContentRef}>
      <SideMenu variant="card" className={sideMenuClass}>
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
        {canViewAiCosts && (
          <NavLink
            to="/management/user-buckets"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="ban" />
            <span style={{ marginLeft: '1.1rem' }}>User Buckets</span>
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
            <span style={{ marginLeft: '1.1rem' }}>Performance</span>
          </NavLink>
        )}
        {canViewScrollDiagnostics && (
          <NavLink
            to="/management/scroll-diagnostics"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="chart-line" />
            <span style={{ marginLeft: '1.1rem' }}>Scroll Diagnostics</span>
          </NavLink>
        )}
        {canViewBuildWorlds && (
          <NavLink
            to="/management/build-worlds"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="cubes" />
            <span style={{ marginLeft: '1.1rem' }}>Build Worlds</span>
          </NavLink>
        )}
        {canViewAiCardImage && (
          <NavLink
            to="/management/ai-card-image"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="image" />
            <span style={{ marginLeft: '1.1rem' }}>AI Card Image</span>
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
              location.pathname.startsWith('/management/notable-users')
                ? 'active'
                : ''
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
        {canViewAiCosts && (
          <nav
            className={
              location.pathname === `/management/user-buckets` ? 'active' : ''
            }
            onClick={() => navigate('/management/user-buckets')}
          >
            User Buckets
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
        {canViewScrollDiagnostics && (
          <nav
            className={
              location.pathname === `/management/scroll-diagnostics`
                ? 'active'
                : ''
            }
            onClick={() => navigate('/management/scroll-diagnostics')}
          >
            Scroll Diag
          </nav>
        )}
        {canViewBuildWorlds && (
          <nav
            className={
              location.pathname === `/management/build-worlds` ? 'active' : ''
            }
            onClick={() => navigate('/management/build-worlds')}
          >
            Build Worlds
          </nav>
        )}
        {canViewAiCardImage && (
          <nav
            className={
              location.pathname === `/management/ai-card-image` ? 'active' : ''
            }
            onClick={() => navigate('/management/ai-card-image')}
          >
            AI Card Image
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

// The management nav keeps growing (Accounts → AI Card Image and counting),
// which is what pushed it off-screen. Keep it floating and vertically centered
// like the other card menus (Explore etc.), but shrink the font and tighten the
// item spacing so the full list fits within the viewport on one screen. We
// deliberately do NOT make this element scrollable: overflow on a flex column
// forces horizontal clipping too, which would cut the active item's pill/shadow
// and make the menu read as sitting *behind* the content. The `&&` raises
// specificity so these win over the shared SideMenu base styles without
// changing that component for its other (short-menu) consumers.
const sideMenuClass = css`
  && {
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.5rem;
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
    > a,
    > nav {
      margin: 0.3rem 0.9rem;
      padding: 0.65rem 1.1rem;
    }
  }
`;
