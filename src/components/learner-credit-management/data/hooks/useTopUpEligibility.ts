import { useQuery } from '@tanstack/react-query';
import { camelCaseObject } from '@edx/frontend-platform/utils';

import { features } from '../../../../config';
import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import { learnerCreditManagementQueryKeys } from '../constants';
import { TopUpEligibility } from '../types';

type UseTopUpEligibilityArgs = {
  enterpriseId: string;
  policyUuid: string;
  // When true, requests only this budget (`policy_uuid`), as the Add Funds page does. Otherwise
  // requests every budget of the enterprise; budget cards share that one request through the cache.
  isSingleBudgetRequest?: boolean;
  enabled?: boolean;
};

const getTopUpEligibility = async (
  enterpriseCustomerUuid: string,
  policyUuid?: string,
): Promise<TopUpEligibility[]> => {
  const response = await EnterpriseAccessApiService.getTopUpEligibility({ enterpriseCustomerUuid, policyUuid });
  return camelCaseObject(response.data.results);
};

// 403 and 404 (including the backend feature flag being off) won't change on retry.
const retryTopUpEligibility = (failureCount: number, error) => {
  const httpErrorStatus = error?.customAttributes?.httpErrorStatus;
  if (httpErrorStatus >= 400 && httpErrorStatus < 500) {
    return false;
  }
  return failureCount < 1;
};

/**
 * Retrieves whether a budget can be topped up ("Add funds") and, when it can't, every reason why.
 *
 * `data` is the budget's eligibility row, or `null` when the response has no row for it (e.g., an
 * inactive policy). Callers treat an error the same as no row: the Add Funds CTA is hidden.
 */
const useTopUpEligibility = ({
  enterpriseId,
  policyUuid,
  isSingleBudgetRequest = false,
  enabled = true,
}: UseTopUpEligibilityArgs) => useQuery({
  queryKey: isSingleBudgetRequest
    ? learnerCreditManagementQueryKeys.budgetTopUpEligibility(enterpriseId, policyUuid)
    : learnerCreditManagementQueryKeys.topUpEligibility(enterpriseId),
  queryFn: () => getTopUpEligibility(enterpriseId, isSingleBudgetRequest ? policyUuid : undefined),
  enabled: enabled && !!features.TOP_UP_LEARNER_CREDIT && !!enterpriseId && !!policyUuid,
  retry: retryTopUpEligibility,
  select: (results) => results.find((result) => result.policyUuid === policyUuid) ?? null,
});

export default useTopUpEligibility;
