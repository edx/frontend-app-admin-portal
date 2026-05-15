import { renderHook } from '@testing-library/react';

import { useEnterpriseSubsidiesContext } from '../../index';
import * as hooks from '../hooks';
import { SUBSIDY_TYPES } from '../../../../data/constants/subsidyTypes';

jest.mock('../hooks');
jest.mock('../../../../data/services/EnterpriseAccessApiService');

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';

describe('useEnterpriseSubsidiesContext', () => {
  const basicProps = {
    enablePortalLearnerCreditManagementScreen: true,
    enterpriseId: TEST_ENTERPRISE_UUID,
  };

  it.each([
    {
      isLoadingBudgets: false,
      budgets: [{ uuid: 'offer-id' }],
      customerAgreement: { subscriptions: [{ uuid: 'subscription-id' }] },
      expectedEnterpriseSubsidyTypes: [
        SUBSIDY_TYPES.budget,
        SUBSIDY_TYPES.license,
      ],
    },
    {
      isLoadingBudgets: true,
      budgets: undefined,
      customerAgreement: { subscriptions: [{ uuid: 'subscription-id' }] },
      expectedEnterpriseSubsidyTypes: [
        SUBSIDY_TYPES.license,
      ],
    },
    {
      isLoadingBudgets: false,
      budgets: [],
      customerAgreement: { subscriptions: [{ uuid: 'subscription-id' }] },
      expectedEnterpriseSubsidyTypes: [
        SUBSIDY_TYPES.license,
      ],
    },
    {
      isLoadingBudgets: false,
      budgets: [],
      customerAgreement: { subscriptions: [] },
      expectedEnterpriseSubsidyTypes: [],
    },
  ])('returns the correct enterpriseSubsidyTypes (%s)', ({
    isLoadingBudgets, budgets, customerAgreement, expectedEnterpriseSubsidyTypes,
  }) => {
    hooks.useEnterpriseBudgets.mockReturnValue({
      data: isLoadingBudgets ? undefined : {
        budgets,
        canManageLearnerCredit: !!budgets.length,
      },
    });
    hooks.useCustomerAgreement.mockReturnValue({
      customerAgreement,
    });
    hooks.useBillingSubscriptionAvailable.mockReturnValue({
      hasBillingSubscription: false,
      isLoading: false,
    });

    const { result } = renderHook(() => useEnterpriseSubsidiesContext(basicProps));
    expect(result.current.enterpriseSubsidyTypes).toEqual(expectedEnterpriseSubsidyTypes);
  });

  describe('hasBillingSubscription propagation', () => {
    beforeEach(() => {
      hooks.useEnterpriseBudgets.mockReturnValue({
        data: {
          budgets: [],
          canManageLearnerCredit: false,
        },
        isLoading: false,
      });
      hooks.useCustomerAgreement.mockReturnValue({
        customerAgreement: { subscriptions: [] },
        isLoading: false,
      });
    });

    it('returns hasBillingSubscription=true when hook returns true', () => {
      hooks.useBillingSubscriptionAvailable.mockReturnValue({
        hasBillingSubscription: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useEnterpriseSubsidiesContext(basicProps));
      expect(result.current.hasBillingSubscription).toBe(true);
    });

    it('returns hasBillingSubscription=false when hook returns false', () => {
      hooks.useBillingSubscriptionAvailable.mockReturnValue({
        hasBillingSubscription: false,
        isLoading: false,
      });

      const { result } = renderHook(() => useEnterpriseSubsidiesContext(basicProps));
      expect(result.current.hasBillingSubscription).toBe(false);
    });

    it('includes billing subscription loading state in overall isLoading', () => {
      hooks.useBillingSubscriptionAvailable.mockReturnValue({
        hasBillingSubscription: false,
        isLoading: true,
      });

      const { result } = renderHook(() => useEnterpriseSubsidiesContext(basicProps));
      expect(result.current.isLoading).toBe(true);
    });

    it('isLoading is false when billing subscription is done loading', () => {
      hooks.useBillingSubscriptionAvailable.mockReturnValue({
        hasBillingSubscription: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useEnterpriseSubsidiesContext(basicProps));
      expect(result.current.isLoading).toBe(false);
    });
  });
});
