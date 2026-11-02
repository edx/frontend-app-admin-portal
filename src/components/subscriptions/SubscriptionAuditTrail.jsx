import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';

import AuditTrail, {
  LICENSE_AUDIT_ACTION_TYPES,
  LICENSE_AUDIT_SOURCES,
  useAuditTrailTableState,
} from '../AuditTrail';
import { useLicenseAuditTrail } from './data/hooks';

const initialTableData = { results: [], itemCount: 0, pageCount: 1 };

const SubscriptionAuditTrail = ({ enterpriseId }) => {
  const intl = useIntl();
  const {
    filters,
    updateFilters,
    fetchTableData,
    queryOptions,
  } = useAuditTrailTableState();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useLicenseAuditTrail({ enterpriseId, queryOptions });

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
      tableData={data || initialTableData}
      fetchTableData={fetchTableData}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={refetch}
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
