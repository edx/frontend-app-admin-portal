import React from 'react';
import PropTypes from 'prop-types';
import { Badge, Icon } from '@openedx/paragon';
import { Check, Close } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import { AUDIT_TRAIL_STATUSES } from './data/constants';
import { ERROR_REASON_MESSAGES } from './data/messages';
import { getStatusLabel } from './data/utils';

/**
 * Displays whether an audit trail action succeeded or failed and, for failures, why (e.g. "Email delivery failed").
 */
const AuditTrailStatusCell = ({ row }) => {
  const intl = useIntl();
  const { status, errorReason } = row.original;
  if (!status) {
    return null;
  }
  const isFailed = status === AUDIT_TRAIL_STATUSES.failed;
  return (
    <div>
      <Badge variant={isFailed ? 'danger' : 'success'} className="d-inline-flex align-items-center">
        <Icon src={isFailed ? Close : Check} size="xs" className="mr-1" />
        {getStatusLabel(intl, status)}
      </Badge>
      {isFailed && ERROR_REASON_MESSAGES[errorReason] && (
        <div className="x-small text-muted">{intl.formatMessage(ERROR_REASON_MESSAGES[errorReason])}</div>
      )}
    </div>
  );
};

AuditTrailStatusCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      status: PropTypes.string,
      errorReason: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default AuditTrailStatusCell;
