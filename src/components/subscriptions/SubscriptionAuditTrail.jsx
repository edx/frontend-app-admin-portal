import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';

import AuditTrail, {
  LICENSE_AUDIT_ACTION_TYPES,
  LICENSE_AUDIT_SOURCES,
  AUDIT_TRAIL_MAX_ITEMS_PER_SOURCE,
  useAuditTrailTableState,
} from '../AuditTrail';
import { useLicenseAuditTrail } from './data/hooks';

const SubscriptionAuditTrail = ({ enterpriseId }) => {
  const intl = useIntl();
  const {
    filters,
    updateFilters,
    fetchTableData,
    tableOptions,
  } = useAuditTrailTableState();
  const {
    tableData,
    isLoading,
    isFetching,
    isError,
    refetch,
    isHistoryTruncated,
  } = useLicenseAuditTrail({ enterpriseId, tableOptions });

  return (
    <AuditTrail
      description={intl.formatMessage({
        id: 'admin.portal.subscription.audit.trail.description',
        defaultMessage: 'History of every action performed on subscription licenses across your plans.',
        description: 'Description for the audit trail tab in subscription management.',
      })}
      actionTypeOptions={LICENSE_AUDIT_ACTION_TYPES}
      sourceOptions={LICENSE_AUDIT_SOURCES}
      filters={filters}
      onFiltersChange={updateFilters}
      tableData={tableData}
      fetchTableData={fetchTableData}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={refetch}
      historyNotice={isHistoryTruncated ? intl.formatMessage({
        id: 'admin.portal.subscription.audit.trail.history.truncated',
        defaultMessage: 'Showing the {count, number} most recent license actions in each plan. Older actions aren\'t included.',
        description: 'Notice shown above the subscription audit trail when a plan has more audit history than is loaded.',
      }, { count: AUDIT_TRAIL_MAX_ITEMS_PER_SOURCE }) : ''}
    />
  );
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

SubscriptionAuditTrail.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

export default connect(mapStateToProps)(SubscriptionAuditTrail);
