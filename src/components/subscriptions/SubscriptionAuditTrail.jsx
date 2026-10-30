import React from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';

import AuditTrail, {
  LICENSE_AUDIT_ACTION_TYPES,
  LICENSE_AUDIT_SOURCES,
  useAuditTrailTableState,
} from '../AuditTrail';

// TODO (ENT-12035): fetch license audit actions once the license-manager audit trail endpoint is available.
// Until then, the tab renders the audit trail UI with its empty state and makes no API requests.
const emptyTableData = { results: [], itemCount: 0, pageCount: 1 };

const SubscriptionAuditTrail = () => {
  const intl = useIntl();
  const {
    filters,
    updateFilters,
    fetchTableData,
  } = useAuditTrailTableState();

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
      tableData={emptyTableData}
      fetchTableData={fetchTableData}
      isLoading={false}
      isFetching={false}
      isError={false}
      onRetry={() => {}}
    />
  );
};

export default SubscriptionAuditTrail;
