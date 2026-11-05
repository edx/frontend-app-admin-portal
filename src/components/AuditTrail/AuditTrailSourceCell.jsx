import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import { getSourceLabel } from './data/utils';

const AuditTrailSourceCell = ({ row }) => {
  const intl = useIntl();
  return getSourceLabel(intl, row.original.source);
};

AuditTrailSourceCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      source: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default AuditTrailSourceCell;
