import { useQueries } from '@tanstack/react-query';

import { learnerCreditManagementQueryKeys } from '../constants';
import { getSubsidyAccessPolicy } from './useSubsidyAccessPolicy';

/**
 * Resolves the display names of the given subsidy access policies (budgets) by UUID.
 *
 * Each policy is retrieved individually with the same query key and fetcher as `useSubsidyAccessPolicy`, so the
 * results are shared with (and usually already cached by) the budget detail page. Unlike the enterprise budgets
 * list, this also resolves inactive (retired or expired) budgets and budgets beyond the first page of results.
 *
 * @param policyIds Subsidy access policy UUIDs. Falsy and duplicate ids are ignored.
 * @returns Map of policy UUID to display name, containing only the names resolved so far.
 */
const useSubsidyAccessPolicyNames = (policyIds: Array<string | null | undefined>): Record<string, string> => {
  const uniqueIds = [...new Set(policyIds.filter(Boolean))] as string[];
  const queries = useQueries({
    queries: uniqueIds.map(policyId => ({
      queryKey: learnerCreditManagementQueryKeys.budget(policyId),
      queryFn: getSubsidyAccessPolicy,
    })),
  });

  const namesById: Record<string, string> = {};
  queries.forEach((query, index) => {
    const name = query.data?.displayName;
    if (name) {
      namesById[uniqueIds[index]] = name;
    }
  });
  return namesById;
};

export default useSubsidyAccessPolicyNames;
