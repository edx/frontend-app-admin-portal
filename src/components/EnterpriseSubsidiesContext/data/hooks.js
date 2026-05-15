import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { logError } from '@edx/frontend-platform/logging';
import { camelCaseObject } from '@edx/frontend-platform/utils';
import { getConfig } from '@edx/frontend-platform/config';
import { useQuery } from '@tanstack/react-query';
import { useIntl } from '@edx/frontend-platform/i18n';

import LicenseManagerApiService from '../../../data/services/LicenseManagerAPIService';
import { BUDGET_TYPES } from '../../EnterpriseApp/data/constants';
import EnterpriseAccessApiService from '../../../data/services/EnterpriseAccessApiService';
import {
  getBudgetStatus,
  isBudgetRetiredOrExpired,
  learnerCreditManagementQueryKeys,
} from '../../learner-credit-management/data';
import { isAssignableSubsidyAccessPolicyType } from '../../../utils';

dayjs.extend(isBetween);

async function fetchEnterpriseBudgets({
  enterpriseId,
  enablePortalLearnerCreditManagementScreen,
}) {
  // If the LC2 feature is disabled, do nothing.
  if (!getConfig().FEATURE_LEARNER_CREDIT_MANAGEMENT || !enablePortalLearnerCreditManagementScreen) {
    return {
      budgets: [],
      canManageLearnerCredit: false,
    };
  }

  // Fetch subsidy access policies
  const budgetPromisesToFulfill = [
    EnterpriseAccessApiService.listSubsidyAccessPolicies(enterpriseId),
  ];

  // Attempt to resolve all promises
  const [
    enterprisePolicyResponse,
  ] = await Promise.allSettled(budgetPromisesToFulfill);

  // Log any errors
  if (enterprisePolicyResponse.status === 'rejected') {
    logError(enterprisePolicyResponse.reason);
  }

  // Transform the API responses
  const enterprisePolicyResults = camelCaseObject(enterprisePolicyResponse.value?.data.results);

  // Iterate through each API response and concatenate the results into a single array of budgets.
  const budgetsList = [];
  enterprisePolicyResults?.forEach((result) => {
    budgetsList.push({
      source: BUDGET_TYPES.policy,
      id: result.uuid,
      name: result.displayName || 'Overview',
      start: result.subsidyActiveDatetime,
      end: result.subsidyExpirationDatetime,
      isCurrent: dayjs().isBetween(result.subsidyActiveDatetime, result.subsidyExpirationDatetime, 'day', '[]'),
      aggregates: {
        available: result.aggregates.spendAvailableUsd,
        spent: result.aggregates.amountRedeemedUsd,
        pending: result.aggregates.amountAllocatedUsd,
      },
      isAssignable: isAssignableSubsidyAccessPolicyType(result),
      isBnREnabled: result.bnrEnabled,
      isRetired: result.retired,
      retiredAt: result.retiredAt,
    });
  });

  return {
    budgets: budgetsList,
    canManageLearnerCredit: budgetsList.length > 0,
  };
}

export const useEnterpriseBudgets = ({
  enablePortalLearnerCreditManagementScreen,
  enterpriseId,
  queryOptions = {},
}) => {
  const intl = useIntl();

  return useQuery({
    queryKey: learnerCreditManagementQueryKeys.budgets(enterpriseId),
    queryFn: (args) => fetchEnterpriseBudgets({
      queryArgs: args,
      enterpriseId,
      enablePortalLearnerCreditManagementScreen,
    }),
    select: (data) => {
      if (!data?.budgets) {
        return data;
      }

      const updatedBudgets = data.budgets.map(budget => {
        if (budget.source === BUDGET_TYPES.policy) {
          const { status } = getBudgetStatus({
            intl,
            startDateStr: budget.start,
            endDateStr: budget.end,
            isBudgetRetired: budget.isRetired,
          });
          return {
            ...budget,
            isRetiredOrExpired: isBudgetRetiredOrExpired(status),
          };
        }
        return budget;
      });

      const transformedData = {
        ...data,
        budgets: updatedBudgets,
      };

      if (queryOptions.select) {
        return queryOptions.select(transformedData);
      }

      return transformedData;
    },
  });
};

export const useCustomerAgreement = ({ enterpriseId }) => {
  const [customerAgreement, setCustomerAgreement] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerAgreement = async () => {
      try {
        const response = await LicenseManagerApiService.fetchCustomerAgreementData({
          enterprise_customer_uuid: enterpriseId,
        });
        const { results } = camelCaseObject(response.data);
        if (results.length > 0) {
          setCustomerAgreement(results[0]);
        }
      } catch (error) {
        logError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerAgreement();
  }, [enterpriseId]);

  return {
    customerAgreement,
    isLoading,
  };
};

/**
 * Hook to check if billing subscription is available from the billing-management API.
 * Returns true only if the API returns a valid subscription (not null/404).
 * Gracefully handles errors by returning false (hide billing tab on errors).
 */
export const useBillingSubscriptionAvailable = ({ enterpriseId }) => {
  const [hasBillingSubscription, setHasBillingSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBillingSubscription = async () => {
      try {
        const response = await EnterpriseAccessApiService.getSubscription(enterpriseId);
        const subscriptionData = response.data.subscription ?? response.data;
        setHasBillingSubscription(!!subscriptionData);
      } catch (error) {
        logError(error);
        setHasBillingSubscription(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingSubscription();
  }, [enterpriseId]);

  return {
    hasBillingSubscription,
    isLoading,
  };
};
