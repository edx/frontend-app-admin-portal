import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

// Formats the timestamp on a single line in the viewer's locale and local time zone, e.g. "Oct 28, 2026, 1:01:42 PM".
const TIMESTAMP_FORMAT_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
};

const AuditTrailTimestampCell = ({ row }) => {
  const intl = useIntl();
  const { timestamp } = row.original;
  if (!timestamp) {
    return null;
  }
  return <span className="text-nowrap">{intl.formatDate(timestamp, TIMESTAMP_FORMAT_OPTIONS)}</span>;
};

AuditTrailTimestampCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      timestamp: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default AuditTrailTimestampCell;
