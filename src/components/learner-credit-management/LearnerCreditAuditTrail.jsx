import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';

import AuditTrail, {
  ASSIGNMENT_AUDIT_ACTION_TYPES,
  ASSIGNMENT_AUDIT_SOURCES,
  AUDIT_TRAIL_MAX_ITEMS_PER_SOURCE,
  useAuditTrailTableState,
} from '../AuditTrail';
import { useAssignmentAuditTrail } from './data';

const LearnerCreditAuditTrail = ({ enterpriseId }) => {
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
  } = useAssignmentAuditTrail({ enterpriseId, tableOptions });

  return (
    <AuditTrail
      description={intl.formatMessage({
        id: 'lcm.audit.trail.description',
        defaultMessage: 'History of every action performed on learner credit assignments across your budgets.',
        description: 'Description for the audit trail tab on the learner credit management page.',
      })}
      actionTypeOptions={ASSIGNMENT_AUDIT_ACTION_TYPES}
      sourceOptions={ASSIGNMENT_AUDIT_SOURCES}
      filters={filters}
      onFiltersChange={updateFilters}
      tableData={tableData}
      fetchTableData={fetchTableData}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={refetch}
      historyNotice={isHistoryTruncated ? intl.formatMessage({
        id: 'lcm.audit.trail.history.truncated',
        defaultMessage: 'Showing history for the {count, number} most recently allocated or reminded assignments in each budget. Older assignments aren\'t included.',
        description: 'Notice shown above the learner credit audit trail when a budget has more assignments than are loaded.',
      }, { count: AUDIT_TRAIL_MAX_ITEMS_PER_SOURCE }) : ''}
    />
  );
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

LearnerCreditAuditTrail.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

export default connect(mapStateToProps)(LearnerCreditAuditTrail);
