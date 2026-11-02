import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';

import AuditTrail, {
  ASSIGNMENT_AUDIT_ACTION_TYPES,
  ASSIGNMENT_AUDIT_SOURCES,
  useAuditTrailTableState,
} from '../AuditTrail';
import { useAssignmentAuditTrail } from './data';

const initialTableData = { results: [], itemCount: 0, pageCount: 1 };

const LearnerCreditAuditTrail = ({ enterpriseId }) => {
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
  } = useAssignmentAuditTrail({ enterpriseId, queryOptions });

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

LearnerCreditAuditTrail.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

export default connect(mapStateToProps)(LearnerCreditAuditTrail);
