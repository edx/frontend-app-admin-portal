import { renderHook, waitFor } from '@testing-library/react';

import { logError } from '@edx/frontend-platform/logging';

import { useBillingSubscriptionAvailable } from '../hooks';
import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';

jest.mock('../../../../data/services/EnterpriseAccessApiService');
jest.mock('@edx/frontend-platform/logging', () => ({
  logError: jest.fn(),
}));

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';

describe('useBillingSubscriptionAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns hasBillingSubscription=true when API returns subscription data', async () => {
    const mockSubscriptionData = {
      planType: 'Teams',
      status: 'active',
      currentPeriodEnd: 1735689600,
    };

    EnterpriseAccessApiService.getSubscription.mockResolvedValue({
      data: mockSubscriptionData,
    });

    const { result } = renderHook(
      () => useBillingSubscriptionAvailable({
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasBillingSubscription).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasBillingSubscription).toBe(true);
    expect(EnterpriseAccessApiService.getSubscription).toHaveBeenCalledWith(TEST_ENTERPRISE_UUID);
  });

  it('returns hasBillingSubscription=false when API returns null/empty data', async () => {
    EnterpriseAccessApiService.getSubscription.mockResolvedValue({
      data: null,
    });

    const { result } = renderHook(
      () => useBillingSubscriptionAvailable({
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasBillingSubscription).toBe(false);
  });

  it('returns hasBillingSubscription=false without logging an error when API returns 404', async () => {
    const error404 = new Error('Axios Error (Response): 404 - See custom attributes for details.');
    error404.response = { status: 404 };
    error404.customAttributes = { httpErrorStatus: 404 };

    EnterpriseAccessApiService.getSubscription.mockRejectedValue(error404);

    const { result } = renderHook(
      () => useBillingSubscriptionAvailable({
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasBillingSubscription).toBe(false);
    expect(logError).not.toHaveBeenCalled();
  });

  it('returns hasBillingSubscription=false and logs the error when API returns server error', async () => {
    const error500 = new Error('Axios Error (Response): 500 - See custom attributes for details.');
    error500.response = { status: 500 };
    error500.customAttributes = { httpErrorStatus: 500 };

    EnterpriseAccessApiService.getSubscription.mockRejectedValue(error500);

    const { result } = renderHook(
      () => useBillingSubscriptionAvailable({
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasBillingSubscription).toBe(false);
    expect(logError).toHaveBeenCalledWith(error500);
  });

  it('manages loading state correctly', async () => {
    EnterpriseAccessApiService.getSubscription.mockImplementation(
      () => new Promise(resolve => {
        setTimeout(() => resolve({ data: { planType: 'Teams' } }), 10);
      }),
    );

    const { result } = renderHook(
      () => useBillingSubscriptionAvailable({
        enterpriseId: TEST_ENTERPRISE_UUID,
      }),
    );

    // Should start with isLoading=true
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After loading completes, should have data
    expect(result.current.hasBillingSubscription).toBe(true);
  });

  it('calls getSubscription with the correct enterpriseId', async () => {
    const customEnterpriseId = 'custom-enterprise-id-456';

    EnterpriseAccessApiService.getSubscription.mockResolvedValue({
      data: { planType: 'Essentials' },
    });

    renderHook(
      () => useBillingSubscriptionAvailable({
        enterpriseId: customEnterpriseId,
      }),
    );

    await waitFor(() => {
      expect(EnterpriseAccessApiService.getSubscription).toHaveBeenCalledWith(customEnterpriseId);
    });
  });
});
