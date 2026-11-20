import { useContext } from 'react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { camelCaseObject } from '@edx/frontend-platform/utils';
import type { AxiosResponse } from 'axios';

import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import { fetchPaginatedResults } from '../../../AuditTrail/data/utils';
import { SubsidyRequestsContext } from '../../../subsidy-requests';
import {
  learnerCreditManagementQueryKeys,
  useIsMultiPlanFundingEnabled,
} from '../../../learner-credit-management/data';
import type { SubsidyAccessPolicy } from '../../../learner-credit-management/data/types';
import { isAssignableSubsidyAccessPolicyType } from '../../../../utils';

// Per the tech spec (KD-9), only per-learner spend budgets with Browse & Request off can join the pool.
const MULTI_PLAN_ELIGIBLE_POLICY_TYPE = 'PerLearnerSpendCreditAccessPolicy';

export const multiPlanFundingQueryKeys = {
  policies: (enterpriseId: string) => [
    ...learnerCreditManagementQueryKeys.enterpriseCustomer(enterpriseId),
    'multiPlanFundingPolicies',
  ],
};

export type MultiPlanFundingPlan = {
  id: string;
  name: string;
  balance: number;
  // Utilized amount and total, as on the budget detail page header (see `useBudgetDetailHeaderData`).
  spent: number;
  total: number;
  expires: string | null;
  isActive: boolean;
  isScheduled: boolean;
  isMultiPlanEligible: boolean;
  canJoinPool: boolean;
};

/**
 * Whether a budget is allowed to join the multi-plan pool. Budgets that can't join show as "Unavailable".
 */
export const canJoinMultiPlanPool = (policy: SubsidyAccessPolicy): boolean => {
  const isExpired = !!policy.subsidyExpirationDatetime && dayjs().isAfter(policy.subsidyExpirationDatetime);
  return (
    policy.policyType === MULTI_PLAN_ELIGIBLE_POLICY_TYPE
    && !policy.bnrEnabled
    && !policy.retired
    && policy.active !== false
    && !isExpired
  );
};

export const transformMultiPlanFundingPlan = (policy: SubsidyAccessPolicy): MultiPlanFundingPlan => {
  const isExpired = !!policy.subsidyExpirationDatetime && dayjs().isAfter(policy.subsidyExpirationDatetime);
  // Not started yet, like the "Scheduled" budget status (`getBudgetStatus`).
  const isScheduled = !!policy.subsidyActiveDatetime && dayjs().isBefore(policy.subsidyActiveDatetime);
  const {
    spendAvailableUsd = 0,
    amountRedeemedUsd = 0,
    amountAllocatedUsd = 0,
  } = policy.aggregates || {};
  // Same rules as `useBudgetDetailHeaderData`: assignment and Browse & Request budgets also count the funds reserved
  // for assignments / approved requests as utilized, and the total is the budget's spend limit.
  const spent = (isAssignableSubsidyAccessPolicyType(policy) || policy.bnrEnabled)
    ? amountAllocatedUsd + amountRedeemedUsd
    : amountRedeemedUsd;
  const total = typeof policy.spendLimit === 'number' ? policy.spendLimit / 100 : spendAvailableUsd + spent;
  return {
    id: policy.uuid,
    name: policy.displayName,
    balance: spendAvailableUsd,
    spent,
    total,
    expires: policy.subsidyExpirationDatetime,
    isActive: !policy.retired && policy.active !== false && !isExpired && !isScheduled,
    isScheduled: !policy.retired && isScheduled,
    isMultiPlanEligible: !!policy.isMultiPlanEligible,
    canJoinPool: canJoinMultiPlanPool(policy),
  };
};

/**
 * Whether the multi-plan funding opt-in UI should be shown: the frontend flag is on AND multi-plan funding is
 * turned on for this customer (`enable_multi_plan_funding` on the enterprise-access customer configuration, set
 * by ECS). Hidden otherwise (ENT-12446 AC 2).
 */
export const useIsMultiPlanFundingOptInVisible = (): boolean => {
  const isMultiPlanFundingEnabled = useIsMultiPlanFundingEnabled();
  const { subsidyRequestConfiguration } = useContext(SubsidyRequestsContext) || {};
  return isMultiPlanFundingEnabled && subsidyRequestConfiguration?.enableMultiPlanFunding === true;
};

// Fetches every page of the customer's active policies, so customers with more budgets than fit on one API page
// can still manage all of them.
const fetchMultiPlanFundingPlans = async (enterpriseId: string): Promise<MultiPlanFundingPlan[]> => {
  const { results: policies } = await fetchPaginatedResults<SubsidyAccessPolicy>(
    page => EnterpriseAccessApiService.listSubsidyAccessPolicies(enterpriseId, { page }),
  );
  return policies.map(transformMultiPlanFundingPlan);
};

/**
 * Lists the customer's active budgets with their multi-plan pool status.
 */
export const useMultiPlanFundingPlans = (enterpriseId: string, { enabled = true } = {}) => useQuery({
  queryKey: multiPlanFundingQueryKeys.policies(enterpriseId),
  queryFn: () => fetchMultiPlanFundingPlans(enterpriseId),
  enabled: !!enterpriseId && enabled,
});

/**
 * Opts a budget in to or out of the multi-plan pool. On success, the budget detail cache is updated with the
 * returned policy and the plans list is refetched.
 */
export const useUpdateMultiPlanFunding = (enterpriseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, isMultiPlanEligible }: { policyId: string; isMultiPlanEligible: boolean }) => {
      const response: AxiosResponse = await EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding(
        policyId,
        isMultiPlanEligible,
      );
      return camelCaseObject(response.data) as SubsidyAccessPolicy;
    },
    onSuccess: (updatedPolicy, { policyId, isMultiPlanEligible }) => {
      queryClient.setQueryData(
        learnerCreditManagementQueryKeys.budget(policyId),
        (existing: SubsidyAccessPolicy | undefined) => (existing ? {
          ...existing,
          ...updatedPolicy,
          isMultiPlanEligible: updatedPolicy?.isMultiPlanEligible ?? isMultiPlanEligible,
        } : existing),
      );
      queryClient.invalidateQueries({ queryKey: multiPlanFundingQueryKeys.policies(enterpriseId) });
    },
  });
};

/**
 * Whether an API error means multi-plan funding is turned off for the customer (PATCH responds 422).
 */
export const isMultiPlanFundingDisabledError = (error: any): boolean => (
  error?.customAttributes?.httpErrorStatus === 422 || error?.response?.status === 422
);
