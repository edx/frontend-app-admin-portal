import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';

import {
  canJoinMultiPlanPool,
  isMultiPlanFundingDisabledError,
  transformMultiPlanFundingPlan,
  useIsMultiPlanFundingOptInVisible,
  useMultiPlanFundingPlans,
  useUpdateMultiPlanFunding,
} from '../hooks';
import EnterpriseAccessApiService from '../../../../../data/services/EnterpriseAccessApiService';
import { SubsidyRequestsContext } from '../../../../subsidy-requests';
import { queryClient } from '../../../../test/testUtils';

jest.mock('../../../../../data/services/EnterpriseAccessApiService');

const mockStore = configureMockStore([thunk]);
const enterpriseId = 'test-enterprise-uuid';
const future = dayjs().add(1, 'year').toISOString();
const past = dayjs().subtract(1, 'year').toISOString();

const makeWrapper = ({ isMultiPlanFundingEnabled = true, isCustomerSwitchOn = true } = {}) => {
  const store = mockStore({
    portalConfiguration: {
      enterpriseId,
      enterpriseFeatures: { enterpriseMultiPlanFundingEnabled: isMultiPlanFundingEnabled },
    },
  });
  const client = queryClient();
  // eslint-disable-next-line react/prop-types
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <SubsidyRequestsContext.Provider
          value={{ subsidyRequestConfiguration: { enableMultiPlanFunding: isCustomerSwitchOn } }}
        >
          {children}
        </SubsidyRequestsContext.Provider>
      </Provider>
    </QueryClientProvider>
  );
  return Wrapper;
};

describe('multi-plan funding data helpers', () => {
  it.each([
    [{}, true],
    [{ policyType: 'AssignedLearnerCreditAccessPolicy' }, false],
    [{ bnrEnabled: true }, false],
    [{ retired: true }, false],
    [{ active: false }, false],
    [{ subsidyExpirationDatetime: past }, false],
  ])('canJoinMultiPlanPool(%p) is %s', (overrides, expected) => {
    expect(canJoinMultiPlanPool({
      policyType: 'PerLearnerSpendCreditAccessPolicy',
      bnrEnabled: false,
      retired: false,
      active: true,
      subsidyExpirationDatetime: future,
      ...overrides,
    })).toBe(expected);
  });

  it('transforms a policy into a plan row', () => {
    expect(transformMultiPlanFundingPlan({
      uuid: 'p1',
      displayName: 'Plan',
      policyType: 'PerLearnerSpendCreditAccessPolicy',
      subsidyExpirationDatetime: future,
      aggregates: { spendAvailableUsd: 100, amountRedeemedUsd: 50, amountAllocatedUsd: 0 },
      isMultiPlanEligible: true,
      retired: false,
    })).toEqual({
      id: 'p1',
      name: 'Plan',
      balance: 100,
      spent: 50,
      total: 150,
      expires: future,
      isActive: true,
      isScheduled: false,
      isMultiPlanEligible: true,
      canJoinPool: true,
    });
  });

  it('uses the spend limit as the total and counts reserved funds as utilized for assignment budgets', () => {
    const plan = transformMultiPlanFundingPlan({
      uuid: 'p2',
      displayName: 'Assignment plan',
      policyType: 'AssignedLearnerCreditAccessPolicy',
      assignmentConfiguration: { uuid: 'config-1' },
      spendLimit: 4000000,
      subsidyExpirationDatetime: future,
      aggregates: { spendAvailableUsd: 38980, amountRedeemedUsd: 920, amountAllocatedUsd: 100 },
    });
    expect(plan.spent).toBe(1020);
    expect(plan.total).toBe(40000);
  });

  it('counts approved Browse & Request funds as utilized', () => {
    const plan = transformMultiPlanFundingPlan({
      uuid: 'p3',
      displayName: 'B&R plan',
      policyType: 'PerLearnerSpendCreditAccessPolicy',
      bnrEnabled: true,
      subsidyExpirationDatetime: future,
      aggregates: { spendAvailableUsd: 100, amountRedeemedUsd: 50, amountAllocatedUsd: 25 },
    });
    expect(plan.spent).toBe(75);
    expect(plan.total).toBe(175);
  });

  it('treats a plan that has not started yet as scheduled, not active', () => {
    const plan = transformMultiPlanFundingPlan({
      uuid: 'p4',
      displayName: 'Next year plan',
      policyType: 'PerLearnerSpendCreditAccessPolicy',
      subsidyActiveDatetime: future,
      subsidyExpirationDatetime: dayjs().add(2, 'year').toISOString(),
      aggregates: { spendAvailableUsd: 100, amountRedeemedUsd: 0, amountAllocatedUsd: 0 },
    });
    expect(plan.isActive).toBe(false);
    expect(plan.isScheduled).toBe(true);
  });

  it.each([
    [{ customAttributes: { httpErrorStatus: 422 } }, true],
    [{ response: { status: 422 } }, true],
    [{ response: { status: 500 } }, false],
    [undefined, false],
  ])('isMultiPlanFundingDisabledError(%p) is %s', (error, expected) => {
    expect(isMultiPlanFundingDisabledError(error)).toBe(expected);
  });
});

describe('useIsMultiPlanFundingOptInVisible', () => {
  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])('flag=%s, customer switch=%s -> %s', (isMultiPlanFundingEnabled, isCustomerSwitchOn, expected) => {
    const { result } = renderHook(
      () => useIsMultiPlanFundingOptInVisible(),
      { wrapper: makeWrapper({ isMultiPlanFundingEnabled, isCustomerSwitchOn }) },
    );
    expect(result.current).toBe(expected);
  });
});

describe('useMultiPlanFundingPlans', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches the policies and transforms them into plan rows', async () => {
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockResolvedValue({
      data: {
        results: [{
          uuid: 'p1',
          display_name: 'Plan',
          policy_type: 'PerLearnerSpendCreditAccessPolicy',
          bnr_enabled: false,
          retired: false,
          active: true,
          is_multi_plan_eligible: true,
          subsidy_expiration_datetime: future,
          aggregates: { spend_available_usd: 100, amount_redeemed_usd: 50 },
        }],
      },
    });
    const { result } = renderHook(() => useMultiPlanFundingPlans(enterpriseId), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).toHaveBeenCalledWith(enterpriseId, { page: 1 });
    expect(result.current.data).toEqual([expect.objectContaining({
      id: 'p1', name: 'Plan', balance: 100, isMultiPlanEligible: true, canJoinPool: true,
    })]);
  });

  it('fetches every page of policies', async () => {
    const policy = (uuid) => ({
      uuid,
      display_name: uuid,
      policy_type: 'PerLearnerSpendCreditAccessPolicy',
      subsidy_expiration_datetime: future,
      aggregates: { spend_available_usd: 1, amount_redeemed_usd: 0 },
    });
    EnterpriseAccessApiService.listSubsidyAccessPolicies
      .mockResolvedValueOnce({ data: { results: [policy('p1')], next: 'https://example.com/?page=2' } })
      .mockResolvedValueOnce({ data: { results: [policy('p2')], next: null } });

    const { result } = renderHook(() => useMultiPlanFundingPlans(enterpriseId), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).toHaveBeenNthCalledWith(1, enterpriseId, { page: 1 });
    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).toHaveBeenNthCalledWith(2, enterpriseId, { page: 2 });
    expect(result.current.data.map(plan => plan.id)).toEqual(['p1', 'p2']);
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useMultiPlanFundingPlans(enterpriseId, { enabled: false }), { wrapper: makeWrapper() });
    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).not.toHaveBeenCalled();
  });
});

describe('useUpdateMultiPlanFunding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('PATCHes the policy and returns the camelCased policy', async () => {
    EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding.mockResolvedValue({
      data: { uuid: 'p1', is_multi_plan_eligible: true },
    });
    const { result } = renderHook(() => useUpdateMultiPlanFunding(enterpriseId), { wrapper: makeWrapper() });
    let updated;
    await act(async () => {
      updated = await result.current.mutateAsync({ policyId: 'p1', isMultiPlanEligible: true });
    });
    expect(EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding).toHaveBeenCalledWith('p1', true);
    expect(updated).toEqual({ uuid: 'p1', isMultiPlanEligible: true });
  });

  it('surfaces API errors', async () => {
    const error = { customAttributes: { httpErrorStatus: 422 } };
    EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding.mockRejectedValue(error);
    const { result } = renderHook(() => useUpdateMultiPlanFunding(enterpriseId), { wrapper: makeWrapper() });
    await act(async () => {
      await expect(result.current.mutateAsync({ policyId: 'p1', isMultiPlanEligible: true })).rejects.toBe(error);
    });
  });
});
