import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { useIntl } from '@edx/frontend-platform/i18n';
import { camelCaseObject } from '@edx/frontend-platform/utils';

import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import { applyAuditTrailQueryOptions } from '../../../AuditTrail/data/utils';
import auditTrailMessages from '../../../AuditTrail/data/messages';
import { learnerCreditManagementQueryKeys } from '../constants';
import { transformAssignmentsToAuditTrailRows } from '../utils';

/**
 * Recursively fetches every page of content assignments (with their audit trail actions) for an
 * assignment configuration.
 */
const fetchAllContentAssignments = async (assignmentConfigurationUUID, page = 1, results = []) => {
  const response = await EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail(
    assignmentConfigurationUUID,
    { page },
  );
  const { results: pageResults = [], next } = camelCaseObject(response.data);
  const allResults = [...results, ...pageResults];
  if (next) {
    return fetchAllContentAssignments(assignmentConfigurationUUID, page + 1, allResults);
  }
  return allResults;
};

/**
 * Retrieves every audit trail action (``LearnerContentAssignmentAction`` records) across the content assignments
 * of all assignable budgets (subsidy access policies) belonging to the given enterprise customer.
 */
const getAssignmentAuditTrailRows = async (enterpriseId) => {
  const policiesResponse = await EnterpriseAccessApiService.listSubsidyAccessPolicies(enterpriseId);
  const assignmentConfigurationUUIDs = camelCaseObject(policiesResponse.data?.results || [])
    .map(policy => policy.assignmentConfiguration?.uuid)
    .filter(Boolean);
  const assignmentsByBudget = await Promise.all(
    assignmentConfigurationUUIDs.map(uuid => fetchAllContentAssignments(uuid)),
  );
  return transformAssignmentsToAuditTrailRows(assignmentsByBudget.flat(), getAuthenticatedUser());
};

/**
 * Returns a page of learner credit audit trail actions for the given enterprise customer.
 *
 * The enterprise-access admin assignments API returns each assignment's full action history (per budget), so all
 * actions are fetched once and then filtered, sorted and paginated in the browser using `queryOptions`.
 *
 * @param {string} enterpriseId The enterprise customer UUID.
 * @param {object} queryOptions Pagination, ordering and filter options from `useAuditTrailTableState`.
 */
const useAssignmentAuditTrail = ({ enterpriseId, queryOptions }) => {
  const intl = useIntl();
  const { data: auditTrailRows, ...queryResult } = useQuery({
    queryKey: learnerCreditManagementQueryKeys.auditTrail(enterpriseId),
    queryFn: () => getAssignmentAuditTrailRows(enterpriseId),
    enabled: !!enterpriseId,
  });

  const data = useMemo(() => {
    if (!auditTrailRows) {
      return undefined;
    }
    return applyAuditTrailQueryOptions(auditTrailRows, queryOptions, {
      systemActorLabel: intl.formatMessage(auditTrailMessages.actorSystem),
    });
  }, [auditTrailRows, queryOptions, intl]);

  return { ...queryResult, data };
};

export default useAssignmentAuditTrail;
