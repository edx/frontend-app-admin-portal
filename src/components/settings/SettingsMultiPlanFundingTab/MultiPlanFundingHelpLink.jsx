import React from 'react';
import { Hyperlink } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

import { configuration } from '../../../config';
import messages from './messages';

/**
 * Link to the multi-plan funding help center article. Opens in a new tab (Paragon announces this to screen
 * readers). Renders nothing until `ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL` is configured, so no broken link ships.
 */
const MultiPlanFundingHelpLink = () => {
  const helpCenterUrl = configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL;
  if (!helpCenterUrl) {
    return null;
  }
  return (
    <Hyperlink destination={helpCenterUrl} target="_blank">
      <FormattedMessage {...messages.helpCenterLink} />
    </Hyperlink>
  );
};

export default MultiPlanFundingHelpLink;
