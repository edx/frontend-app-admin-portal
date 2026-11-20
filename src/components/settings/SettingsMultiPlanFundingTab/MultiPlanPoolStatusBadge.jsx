import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

import messages from './messages';

// Figma: regular-weight text in a small rounded pill (not Paragon's default bold badge text).
const BADGE_CLASS_NAME = 'font-weight-normal px-2 py-1';

const MultiPlanPoolStatusBadge = ({ canJoinPool, isMultiPlanEligible }) => {
  if (isMultiPlanEligible) {
    return <Badge className={BADGE_CLASS_NAME} variant="success"><FormattedMessage {...messages.inPoolBadge} /></Badge>;
  }
  if (!canJoinPool) {
    return <Badge className={BADGE_CLASS_NAME} variant="dark"><FormattedMessage {...messages.unavailableBadge} /></Badge>;
  }
  return <Badge className={BADGE_CLASS_NAME} variant="light"><FormattedMessage {...messages.notInPoolBadge} /></Badge>;
};

MultiPlanPoolStatusBadge.propTypes = {
  canJoinPool: PropTypes.bool.isRequired,
  isMultiPlanEligible: PropTypes.bool.isRequired,
};

export default MultiPlanPoolStatusBadge;
