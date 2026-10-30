import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';

import { getActionTypeLabel } from './data/utils';

const AuditTrailActionTypeCell = ({ row }) => {
  const intl = useIntl();
  const { actionType } = row.original;
  if (!actionType) {
    return null;
  }
  return <span>{getActionTypeLabel(intl, actionType)}</span>;
};

AuditTrailActionTypeCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      actionType: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default AuditTrailActionTypeCell;
