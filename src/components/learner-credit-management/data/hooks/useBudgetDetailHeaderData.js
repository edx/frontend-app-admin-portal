import { getBudgetStatus } from '../utils';

const assignBudgetStatus = (intl, policy) => {
  const {
    status, badgeVariant, term, date,
  } = getBudgetStatus({
    intl,
    startDateStr: policy.subsidyActiveDatetime,
    endDateStr: policy.subsidyExpirationDatetime,
    isBudgetRetired: policy.retired,
    retiredDateStr: policy.retiredAt,
  });

  return {
    status,
    badgeVariant,
    term,
    date,
  };
};

const assignBudgetDetails = (policy) => {
  if (!policy.aggregates) {
    return {};
  }

  const { spendAvailableUsd, amountAllocatedUsd, amountRedeemedUsd } = policy.aggregates;

  const available = spendAvailableUsd;
  const limit = policy.spendLimit / 100;
  const utilized = (policy.isAssignable) || policy.bnrEnabled
    ? (amountAllocatedUsd + amountRedeemedUsd)
    : amountRedeemedUsd;

  return {
    budgetTotalSummary: {
      available,
      limit,
      utilized,
    },
  };
};

const useBudgetDetailHeaderData = ({
  intl,
  subsidyAccessPolicy,
  budgetId,
}) => {
  const policy = subsidyAccessPolicy;

  const transformedPolicyData = {
    budgetId,
    budgetTotalSummary: {
      available: 0,
      utilized: 0,
      limit: 0,
    },
    budgetAggregates: policy?.aggregates || {},
    isAssignable: policy?.isAssignable || false,
    budgetDisplayName: policy?.displayName || 'Overview',
    isRetired: policy?.retired || false,
  };

  if (policy) {
    Object.assign(transformedPolicyData, assignBudgetStatus(intl, policy));
    Object.assign(transformedPolicyData, assignBudgetDetails(policy));
  }
  return transformedPolicyData;
};

export default useBudgetDetailHeaderData;
