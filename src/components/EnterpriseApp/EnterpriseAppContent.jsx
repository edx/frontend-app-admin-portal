import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';

import { EnterpriseAppContext } from './EnterpriseAppContextProvider';
import EnterpriseAppRoutes from './EnterpriseAppRoutes';
import FeatureAnnouncementBanner from '../FeatureAnnouncementBanner';

const EnterpriseAppContent = ({
  email,
  enterpriseId,
  enterpriseName,
  enterpriseSlug,
  enableCodeManagementPage,
  enableReportingPage,
  enableSubscriptionManagementPage,
  enableAnalyticsPage,
  enablePeopleManagementPage,
}) => {
  const { FEATURE_CONTENT_HIGHLIGHTS } = getConfig();
  const enterpriseAppContext = useContext(EnterpriseAppContext);
  const { enterpriseCuration: { enterpriseCuration } } = enterpriseAppContext;

  const isContentHighlightsEnabled = !!(
    FEATURE_CONTENT_HIGHLIGHTS && enterpriseCuration?.isHighlightFeatureActive
  );

  return (
    <>
      <FeatureAnnouncementBanner enterpriseSlug={enterpriseSlug} />
      <EnterpriseAppRoutes
        email={email}
        enterpriseId={enterpriseId}
        enterpriseName={enterpriseName}
        enableCodeManagementPage={enableCodeManagementPage}
        enableReportingPage={enableReportingPage}
        enableSubscriptionManagementPage={enableSubscriptionManagementPage}
        enableAnalyticsPage={enableAnalyticsPage}
        enableContentHighlightsPage={isContentHighlightsEnabled}
        enablePeopleManagementPage={enablePeopleManagementPage}
      />
    </>
  );
};

EnterpriseAppContent.propTypes = {
  email: PropTypes.string.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  enterpriseName: PropTypes.string.isRequired,
  enterpriseSlug: PropTypes.string.isRequired,
  enableCodeManagementPage: PropTypes.bool.isRequired,
  enableReportingPage: PropTypes.bool.isRequired,
  enableSubscriptionManagementPage: PropTypes.bool.isRequired,
  enableAnalyticsPage: PropTypes.bool.isRequired,
  enablePeopleManagementPage: PropTypes.bool.isRequired,
};

export default EnterpriseAppContent;
