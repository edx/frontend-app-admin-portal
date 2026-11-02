import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Button, DataTableContext } from '@openedx/paragon';
import { SwapVert } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from './data/messages';
import { AUDIT_TRAIL_TIMESTAMP_COLUMN } from './data/constants';

/**
 * Toggles the `DataTable` sort order of the timestamp column between newest first and oldest first. Kept in
 * sync with the sort indicator on the timestamp column header, since both use the `DataTable` sort state.
 */
const AuditTrailSortToggle = ({ disabled }) => {
  const intl = useIntl();
  const { state, toggleSortBy, gotoPage } = useContext(DataTableContext);
  const timestampSort = state.sortBy?.find(({ id }) => id === AUDIT_TRAIL_TIMESTAMP_COLUMN);
  const isNewestFirst = timestampSort ? timestampSort.desc : true;

  const handleClick = () => {
    toggleSortBy(AUDIT_TRAIL_TIMESTAMP_COLUMN, !isNewestFirst, false);
    gotoPage(0);
  };

  return (
    <Button
      variant="outline-primary"
      iconAfter={SwapVert}
      onClick={handleClick}
      disabled={disabled}
    >
      {intl.formatMessage(isNewestFirst ? messages.sortNewestFirst : messages.sortOldestFirst)}
    </Button>
  );
};

AuditTrailSortToggle.propTypes = {
  disabled: PropTypes.bool,
};

AuditTrailSortToggle.defaultProps = {
  disabled: false,
};

export default AuditTrailSortToggle;
