import PropTypes from 'prop-types';

// Shape of the audit trail filters (see `AUDIT_TRAIL_DEFAULT_FILTERS`).
// eslint-disable-next-line import/prefer-default-export
export const auditTrailFiltersPropType = PropTypes.shape({
  actorSearch: PropTypes.string.isRequired,
  actionType: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
});
