import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from './data/messages';

/**
 * Displays the learner affected by an audit trail action. Learner PII may be retired (e.g. enterprise-access
 * clears learner emails on expired assignments), in which case a placeholder is shown instead.
 */
const AuditTrailLearnerCell = ({ row }) => {
  const intl = useIntl();
  const { learnerEmail, learnerName } = row.original;
  if (!learnerEmail && !learnerName) {
    return <span className="text-muted">{intl.formatMessage(messages.learnerRemoved)}</span>;
  }
  return (
    <div>
      <div>{learnerEmail || learnerName}</div>
      {learnerEmail && learnerName && <div className="small text-muted">{learnerName}</div>}
    </div>
  );
};

AuditTrailLearnerCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      learnerEmail: PropTypes.string,
      learnerName: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default AuditTrailLearnerCell;
