import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Alert } from '@edx/paragon';
import { logError } from '@edx/frontend-platform/logging';

import LmsApiService from '../../data/services/LmsApiService';

const FeatureAnnouncementBanner = ({ enterpriseSlug }) => {
  const [enterpriseNotificationBanner, setEnterpriseNotificationBanner] = useState({
    text: null,
    notificationId: null,
  });
  const [isRead, setIsRead] = useState(false);

  const markAsRead = () => {
    setIsRead(true);
    LmsApiService.markBannerNotificationAsRead({
      enterprise_slug: enterpriseSlug,
      notification_id: enterpriseNotificationBanner.notificationId,
    });
  };

  useEffect(() => {
    LmsApiService.fetchEnterpriseBySlug(enterpriseSlug)
      .then((response) => {
        if (response.data && response.data.enterprise_notification_banner) {
          setEnterpriseNotificationBanner({
            text: response.data.enterprise_notification_banner.text,
            notificationId: response.data.enterprise_notification_banner.id,
          });
        }
      })
      .catch((error) => {
        // We can ignore errors here as user will se the banner in the next page refresh.
        logError(error);
      });
  }, [enterpriseSlug]);

  return (
    isRead || !enterpriseNotificationBanner.text ? null : (
      <div>
        <Alert variant="info" dismissible onClose={markAsRead}>
          <Alert.Heading>We have a new feature for you!</Alert.Heading>
          <p>
            {enterpriseNotificationBanner.text}
          </p>
        </Alert>
      </div>
    )
  );
};

FeatureAnnouncementBanner.propTypes = {
  enterpriseSlug: PropTypes.string.isRequired,
};

export default FeatureAnnouncementBanner;
