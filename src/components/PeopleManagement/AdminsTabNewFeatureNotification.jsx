import React, { useRef, useState } from 'react';
import { Bubble, ProductTour } from '@openedx/paragon';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { sendEnterpriseTrackEvent } from '@edx/frontend-enterprise-utils';

import { TOUR_TARGETS } from '../ProductTours/constants';

export const ADMINS_TAB_NEW_FEATURE_NOTIFICATION_EVENT_NAME = 'edx.ui.enterprise.admin-portal.people-management.admins-tab-notification.dismissed';

export const generateAdminsTabAlertCookieName = (enterpriseId, username) => (
  `admins-tab-new-feature-alert-${enterpriseId}-${username}`
);

export const generateAdminsTabSeenCookieName = (enterpriseId, username) => (
  `admins-tab-seen-${enterpriseId}-${username}`
);

export const useAdminsTabNewFeature = (enterpriseId) => {
  const user = getAuthenticatedUser();
  const username = user?.username || String(user?.userId ?? 'unknown-user');
  const alertCookieName = generateAdminsTabAlertCookieName(enterpriseId, username);
  const seenCookieName = generateAdminsTabSeenCookieName(enterpriseId, username);

  const [showNotification, setShowNotification] = useState(
    () => !global.localStorage.getItem(alertCookieName),
  );
  const [hasSeenAdminsTab, setHasSeenAdminsTab] = useState(
    () => Boolean(global.localStorage.getItem(seenCookieName)),
  );
  const hasDismissedRef = useRef(false);

  const handleDismissNotification = () => {
    if (hasDismissedRef.current) {
      return;
    }
    hasDismissedRef.current = true;
    setShowNotification(false);
    global.localStorage.setItem(alertCookieName, 'true');
    sendEnterpriseTrackEvent(enterpriseId, ADMINS_TAB_NEW_FEATURE_NOTIFICATION_EVENT_NAME);
  };

  const onAdminsTabClick = () => {
    if (!hasSeenAdminsTab) {
      setHasSeenAdminsTab(true);
      global.localStorage.setItem(seenCookieName, 'true');
    }
  };

  const adminsTabNotificationBubble = !hasSeenAdminsTab ? (
    <Bubble
      variant="error"
      className="position-absolute"
      style={{
        minHeight: '0.5rem',
        minWidth: '0.5rem',
        top: -2,
        right: -8,
      }}
    >
      <span className="sr-only">New feature notification</span>
    </Bubble>
  ) : null;

  const adminsNewFeatureNotification = (
    <div className="admins-tab-new-feature-notification">
      <ProductTour
        tours={[{
          tourId: 'adminsTabNewFeature',
          enabled: showNotification,
          onEnd: handleDismissNotification,
          onDismiss: handleDismissNotification,
          onEscape: handleDismissNotification,
          dismissible: true,
          checkpoints: [
            {
              target: `#${TOUR_TARGETS.PEOPLE_MANAGEMENT}`,
              placement: 'right',
              title: 'New Feature',
              body: "We've recently added the ability for you to invite and manage your admins.",
              onDismiss: handleDismissNotification,
              dismissible: true,
            },
          ],
        }]}
      />
    </div>
  );

  return {
    adminsNewFeatureNotification,
    adminsTabNotificationBubble,
    onAdminsTabClick,
  };
};
