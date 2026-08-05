import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon, PageBanner } from '@openedx/paragon';
import { WarningFilled } from '@openedx/paragon/icons';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

import {
  getNonProductionBannerDismissalStorageKey,
  isNonProductionBannerDismissalActive,
} from './constants';

/**
 * Warns the administrator that they are using a non-production portal. Only rendered for enterprise
 * customers whose customer type is `Non-production` in Django admin. Dismissing the banner hides it
 * for 24 hours.
 */
const NonProductionBanner = ({ enterpriseId, showNonProductionBanner }) => {
  const storageKey = getNonProductionBannerDismissalStorageKey(enterpriseId);
  const [isDismissed, setIsDismissed] = useState(
    () => isNonProductionBannerDismissalActive(storageKey),
  );

  useEffect(() => {
    setIsDismissed(isNonProductionBannerDismissalActive(storageKey));
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    global.localStorage.setItem(storageKey, String(Date.now()));
    setIsDismissed(true);
  }, [storageKey]);

  if (!showNonProductionBanner) {
    return null;
  }

  return (
    <PageBanner
      variant="accentB"
      show={!isDismissed}
      dismissible
      onDismiss={handleDismiss}
    >
      <Icon src={WarningFilled} className="mr-2" />
      <FormattedMessage
        id="adminPortal.pageBanner.nonProductionEnvironment"
        defaultMessage="Non production Environment"
        description="Banner message shown to administrators when their organization's portal is a non-production portal."
      />
    </PageBanner>
  );
};

NonProductionBanner.defaultProps = {
  enterpriseId: null,
  showNonProductionBanner: false,
};

NonProductionBanner.propTypes = {
  enterpriseId: PropTypes.string,
  showNonProductionBanner: PropTypes.bool,
};

export default NonProductionBanner;
