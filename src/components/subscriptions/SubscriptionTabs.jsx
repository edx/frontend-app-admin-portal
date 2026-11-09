import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Tabs, Tab } from '@openedx/paragon';
import {
  useNavigate,
  Route,
  useParams,
  Routes,
} from 'react-router-dom';

import { useIntl } from '@edx/frontend-platform/i18n';
import { SubsidyRequestsContext } from '../subsidy-requests';
import SubscriptionSubsidyRequests from './SubscriptionSubsidyRequests';
import SubscriptionPlanRoutes from './SubscriptionPlanRoutes';
import SubscriptionAuditTrail from './SubscriptionAuditTrail';
import { ROUTE_NAMES } from '../EnterpriseApp/data/constants';
import {
  AUDIT_TRAIL_TAB,
  MANAGE_LEARNERS_TAB,
  MANAGE_REQUESTS_TAB,
  SUBSCRIPTION_TABS_VALUES,
  SUBSCRIPTIONS_TAB_PARAM,
} from './data/constants';
import { SUPPORTED_SUBSIDY_TYPES } from '../../data/constants/subsidyRequests';
import NotFoundPage from '../NotFoundPage';
import { features } from '../../config';

const SubscriptionTabs = ({ enterpriseSlug }) => {
  const { subsidyRequestConfiguration, subsidyRequestsCounts } = useContext(SubsidyRequestsContext);

  const isSubsidyRequestsEnabled = subsidyRequestConfiguration?.subsidyRequestsEnabled;
  const subsidyType = subsidyRequestConfiguration?.subsidyType;
  const isRequestsTabShown = isSubsidyRequestsEnabled && subsidyType === SUPPORTED_SUBSIDY_TYPES.license;
  const isAuditTrailTabShown = !!features.AUDIT_TRAIL;
  const intl = useIntl();

  const requestsTabNotification = useMemo(() => {
    const hasRequests = subsidyRequestsCounts.subscriptionLicenses > 0;
    if (isRequestsTabShown && hasRequests) {
      return (
        <>
          {subsidyRequestsCounts.subscriptionLicenses}
          <span className="sr-only">outstanding enrollment requests</span>
        </>
      );
    }
    return null;
  }, [isRequestsTabShown, subsidyRequestsCounts]);

  const navigate = useNavigate();
  const params = useParams();
  const subscriptionsTab = params[SUBSCRIPTIONS_TAB_PARAM];

  const routesByTabKey = {
    [MANAGE_LEARNERS_TAB]: `/${enterpriseSlug}/admin/${ROUTE_NAMES.subscriptionManagement}/${MANAGE_LEARNERS_TAB}`,
    [MANAGE_REQUESTS_TAB]: `/${enterpriseSlug}/admin/${ROUTE_NAMES.subscriptionManagement}/${MANAGE_REQUESTS_TAB}`,
    [AUDIT_TRAIL_TAB]: `/${enterpriseSlug}/admin/${ROUTE_NAMES.subscriptionManagement}/${AUDIT_TRAIL_TAB}`,
  };

  const handleTabSelect = (key) => {
    if (key === MANAGE_REQUESTS_TAB) {
      navigate(routesByTabKey[MANAGE_REQUESTS_TAB]);
    } else if (key === MANAGE_LEARNERS_TAB) {
      navigate(routesByTabKey[MANAGE_LEARNERS_TAB]);
    } else if (key === AUDIT_TRAIL_TAB) {
      navigate(routesByTabKey[AUDIT_TRAIL_TAB]);
    }
  };

  const visibleTabs = useMemo(() => {
    const tabs = [];
    tabs.push(
      <Tab
        eventKey={SUBSCRIPTION_TABS_VALUES[MANAGE_LEARNERS_TAB]}
        title={intl.formatMessage({
          id: 'admin.portal.subscription.tabs.manage.learners',
          defaultMessage: 'Manage Learners',
          description: 'Title for the Manage Learners tab in subscription management.',
        })}
        className="pt-4"
      >
        {SUBSCRIPTION_TABS_VALUES[MANAGE_LEARNERS_TAB] === subscriptionsTab && (
          <SubscriptionPlanRoutes />
        )}
      </Tab>,
    );
    if (isRequestsTabShown) {
      tabs.push(
        <Tab
          key={SUBSCRIPTION_TABS_VALUES[MANAGE_REQUESTS_TAB]}
          eventKey={SUBSCRIPTION_TABS_VALUES[MANAGE_REQUESTS_TAB]}
          title={intl.formatMessage({
            id: 'admin.portal.subscription.tabs.manage.requests',
            defaultMessage: 'Manage Requests',
            description: 'Title for the Manage Requests tab in subscription management.',
          })}
          className="pt-4"
          notification={requestsTabNotification}
        >
          {SUBSCRIPTION_TABS_VALUES[MANAGE_REQUESTS_TAB] === subscriptionsTab && (
            <Routes>
              <Route
                path="/"
                element={<SubscriptionSubsidyRequests />}
              />
            </Routes>
          )}
        </Tab>,
      );
    }
    if (isAuditTrailTabShown) {
      tabs.push(
        <Tab
          key={SUBSCRIPTION_TABS_VALUES[AUDIT_TRAIL_TAB]}
          eventKey={SUBSCRIPTION_TABS_VALUES[AUDIT_TRAIL_TAB]}
          title={intl.formatMessage({
            id: 'admin.portal.subscription.tabs.audit.trail',
            defaultMessage: 'Audit trail',
            description: 'Title for the Audit trail tab in subscription management.',
          })}
          className="pt-4"
        >
          {SUBSCRIPTION_TABS_VALUES[AUDIT_TRAIL_TAB] === subscriptionsTab && (
            <SubscriptionAuditTrail />
          )}
        </Tab>,
      );
    }
    return tabs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionsTab, isRequestsTabShown, isAuditTrailTabShown, requestsTabNotification]);

  if ((SUBSCRIPTION_TABS_VALUES[MANAGE_LEARNERS_TAB] !== subscriptionsTab)
     && (SUBSCRIPTION_TABS_VALUES[MANAGE_REQUESTS_TAB] !== subscriptionsTab)
     && !(isAuditTrailTabShown && SUBSCRIPTION_TABS_VALUES[AUDIT_TRAIL_TAB] === subscriptionsTab)) {
    return <NotFoundPage />;
  }

  return (
    <Tabs
      id="tabs-subscription-management"
      activeKey={subscriptionsTab}
      onSelect={handleTabSelect}
    >
      {visibleTabs}
    </Tabs>
  );
};

SubscriptionTabs.propTypes = {
  enterpriseSlug: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseSlug: state.portalConfiguration.enterpriseSlug,
});

export default connect(mapStateToProps)(SubscriptionTabs);
