import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

import { AUDIT_TRAIL_TIMESTAMP_FORMAT } from './data/constants';

const AuditTrailTimestampCell = ({ row }) => {
  const { timestamp } = row.original;
  if (!timestamp) {
    return null;
  }
  return <span className="text-nowrap">{dayjs(timestamp).format(AUDIT_TRAIL_TIMESTAMP_FORMAT)}</span>;
};

AuditTrailTimestampCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      timestamp: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default AuditTrailTimestampCell;
