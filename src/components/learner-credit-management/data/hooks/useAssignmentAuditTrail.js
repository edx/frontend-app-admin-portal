import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import {
  fetchPaginatedResults,
  mapWithConcurrencyLimit,
} from '../../../AuditTrail/data/utils';
import {
  AUDIT_TRAIL_API_PAGE_SIZE,
  AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS,
  AUDIT_TRAIL_MAX_PAGES_PER_SOURCE,
} from '../../../AuditTrail/data/constants';
import { useAuditTrailQuery } from '../../../AuditTrail/data/hooks';
import { learnerCreditManagementQueryKeys } from '../constants';
import { transformAssignmentsToAuditTrailRows } from '../utils';

/**
 * Retrieves the audit trail actions (``LearnerContentAssignmentAction`` records) of the content assignments of all
 * assignable budgets (subsidy access policies) belonging to the given enterprise customer. Inactive budgets are
 * included, so that the history of retired budgets is still shown.
 *
 * Loading is bounded per budget: at most `AUDIT_TRAIL_MAX_PAGES_PER_SOURCE` pages of its most recently allocated or
 * reminded assignments are fetched (the only activity ordering the API supports), for at most
 * `AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS` budgets at a time. `isTruncated` is true when older assignments were left
 * out. `signal` cancels the requests when the query is cancelled.
 */
const getAssignmentAuditTrailHistory = async (enterpriseId, signal) => {
  const { results: policies } = await fetchPaginatedResults(
    page => EnterpriseAccessApiService.listSubsidyAccessPolicies(enterpriseId, { includeInactive: true, page, signal }),
  );
  const assignmentConfigurationUUIDs = [
    ...new Set(policies.map(policy => policy.assignmentConfiguration?.uuid).filter(Boolean)),
  ];
  const assignmentsByBudget = await mapWithConcurrencyLimit(
    assignmentConfigurationUUIDs,
    AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS,
    uuid => fetchPaginatedResults(
      page => EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail(
        uuid,
        { page, pageSize: AUDIT_TRAIL_API_PAGE_SIZE, signal },
      ),
      { maxPages: AUDIT_TRAIL_MAX_PAGES_PER_SOURCE },
    ),
  );
  return {
    rows: transformAssignmentsToAuditTrailRows(
      assignmentsByBudget.flatMap(({ results }) => results),
      getAuthenticatedUser(),
    ),
    isTruncated: assignmentsByBudget.some(({ isTruncated }) => isTruncated),
  };
};

/**
 * Returns a page of learner credit audit trail actions for the given enterprise customer (`tableData`), and whether
 * older history was left out (`isHistoryTruncated`); see `useAuditTrailQuery`.
 *
 * The enterprise-access admin assignments API returns each assignment's full action history (per budget), so the
 * actions are fetched once (see `getAssignmentAuditTrailHistory`) and then filtered, sorted and paginated in the
 * browser using `tableOptions`.
 *
 * @param {string} enterpriseId The enterprise customer UUID.
 * @param {object} tableOptions Filters and `DataTable` (pagination/sort) state from `useAuditTrailTableState`.
 */
const useAssignmentAuditTrail = ({ enterpriseId, tableOptions }) => useAuditTrailQuery({
  queryKey: learnerCreditManagementQueryKeys.auditTrail(enterpriseId),
  queryFn: ({ signal }) => getAssignmentAuditTrailHistory(enterpriseId, signal),
  enabled: !!enterpriseId,
  tableOptions,
});

export default useAssignmentAuditTrail;
