import { renderHook, waitFor } from '@testing-library/react';
import { logError } from '@edx/frontend-platform/logging';
import dayjs from 'dayjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import { useCustomerAgreement, useEnterpriseBudgets } from '../hooks';
import LicenseManagerApiService from '../../../../data/services/LicenseManagerAPIService';
import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import { BUDGET_TYPES } from '../../../EnterpriseApp/data/constants';
import { queryClient } from '../../../test/testUtils';

jest.mock('@edx/frontend-platform/config', () => ({
  ...jest.requireActual('@edx/frontend-platform/config'),
  getConfig: jest.fn(() => ({
    FEATURE_LEARNER_CREDIT_MANAGEMENT: true,
  })),
}));
jest.mock('@edx/frontend-platform/logging', () => ({
  ...jest.requireActual('@edx/frontend-platform/logging'),
  logError: jest.fn(),
}));
jest.mock('../../../../data/services/LicenseManagerAPIService');
jest.mock('../../../../data/services/EnterpriseAccessApiService');

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';

describe('useEnterpriseBudgets', () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient()}>
      <IntlProvider locale="en">
        {children}
      </IntlProvider>
    </QueryClientProvider>
  );

  const listSubsidyAccessPoliciesSpy = jest.spyOn(EnterpriseAccessApiService, 'listSubsidyAccessPolicies').mockResolvedValue({
    data: {
      results: [],
    },
  });

  const mockBudgetStart = dayjs().subtract(1, 'week').toISOString();
  const mockBudgetEnd = dayjs().add(1, 'week').toISOString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not fetch any budgets if enablePortalLearnerCreditManagementScreen is false', async () => {
    const { result } = renderHook(
      () => useEnterpriseBudgets({
        enablePortalLearnerCreditManagementScreen: false,
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
      { wrapper },
    );

    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current).toEqual(
        expect.objectContaining({
          isLoading: false,
          data: {
            canManageLearnerCredit: false,
            budgets: [],
          },
        }),
      );
    });
  });

  it('should fetch subsidy access policies', async () => {
    const mockPolicyResponse = [
      {
        uuid: 'test-policy-uuid',
        display_name: 'Test Policy',
        subsidy_active_datetime: mockBudgetStart,
        subsidy_expiration_datetime: mockBudgetEnd,
        aggregates: {
          spend_available_usd: 1000,
          amount_redeemed_usd: 500,
          amount_allocated_usd: 200,
        },
        policy_type: 'AssignedLearnerCreditAccessPolicy',
        bnr_enabled: false,
        retired: false,
        retired_at: null,
      },
    ];

    listSubsidyAccessPoliciesSpy.mockResolvedValueOnce({
      data: {
        results: mockPolicyResponse,
      },
    });

    const { result } = renderHook(
      () => useEnterpriseBudgets({
        enablePortalLearnerCreditManagementScreen: true,
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(listSubsidyAccessPoliciesSpy).toHaveBeenCalledWith(TEST_ENTERPRISE_UUID);
    expect(result.current.data.budgets).toHaveLength(1);
    expect(result.current.data.budgets[0]).toEqual(
      expect.objectContaining({
        source: BUDGET_TYPES.policy,
        id: 'test-policy-uuid',
        name: 'Test Policy',
      }),
    );
    expect(result.current.data.canManageLearnerCredit).toBe(true);
  });

  it('should log error when policy API fails', async () => {
    const mockError = new Error('API failure');
    listSubsidyAccessPoliciesSpy.mockRejectedValueOnce(mockError);

    const { result } = renderHook(
      () => useEnterpriseBudgets({
        enablePortalLearnerCreditManagementScreen: true,
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(logError).toHaveBeenCalledWith(mockError);
  });
});

describe('useCustomerAgreement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch customer agreement for the enterprise', async () => {
    const mockCustomerAgreement = {
      subscriptions: [],
    };
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValueOnce({
      data: {
        results: [mockCustomerAgreement],
      },
    });
    const { result } = renderHook(() => useCustomerAgreement({
      enterpriseId: TEST_ENTERPRISE_UUID,
    }));

    await waitFor(() => {
      expect(LicenseManagerApiService.fetchCustomerAgreementData).toHaveBeenCalledWith({
        enterprise_customer_uuid: TEST_ENTERPRISE_UUID,
      });
    });

    expect(result.current).toEqual({
      customerAgreement: mockCustomerAgreement,
      isLoading: false,
    });
  });

  it('should not set customer agreement if results are empty', async () => {
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValueOnce({
      data: {
        results: [],
      },
    });
    const { result } = renderHook(() => useCustomerAgreement({
      enterpriseId: TEST_ENTERPRISE_UUID,
    }));

    await waitFor(() => {
      expect(LicenseManagerApiService.fetchCustomerAgreementData).toHaveBeenCalled();
    });

    expect(result.current).toEqual({
      customerAgreement: undefined,
      isLoading: false,
    });
  });
});
