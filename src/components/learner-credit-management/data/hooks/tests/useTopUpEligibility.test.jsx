import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import useTopUpEligibility from '../useTopUpEligibility';
import EnterpriseAccessApiService from '../../../../../data/services/EnterpriseAccessApiService';
import { queryClient } from '../../../../test/testUtils';
import { features } from '../../../../../config';

jest.mock('../../../../../data/services/EnterpriseAccessApiService', () => ({
  getTopUpEligibility: jest.fn(),
}));

const mockEnterpriseId = 'test-enterprise-uuid';
const mockPolicyUuid = '9af340a9-48de-4d94-976d-e2282b9eb7f3';
const mockOtherPolicyUuid = 'b1c2d3e4-48de-4d94-976d-e2282b9eb7f3';

const mockResponse = {
  data: {
    results: [
      {
        policy_uuid: mockPolicyUuid,
        is_eligible: false,
        reasons: [{ error_code: 'budget_expiring_soon', message: 'The budget expires in fewer than 14 days.' }],
        subsidy_expiration_datetime: '2026-11-03T11:38:00Z',
      },
      {
        policy_uuid: mockOtherPolicyUuid,
        is_eligible: true,
        reasons: [],
        subsidy_expiration_datetime: '3026-11-03T11:38:00Z',
      },
    ],
  },
};

const httpError = (httpErrorStatus) => Object.assign(new Error(`HTTP ${httpErrorStatus}`), {
  customAttributes: { httpErrorStatus },
});

const renderUseTopUpEligibility = (args, client = queryClient()) => renderHook(
  (props) => useTopUpEligibility(props),
  {
    initialProps: { enterpriseId: mockEnterpriseId, policyUuid: mockPolicyUuid, ...args },
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  },
);

describe('useTopUpEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    features.TOP_UP_LEARNER_CREDIT = true;
    EnterpriseAccessApiService.getTopUpEligibility.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    features.TOP_UP_LEARNER_CREDIT = false;
  });

  it('returns the camelCased row for the requested budget from the enterprise-wide request', async () => {
    const { result } = renderUseTopUpEligibility();

    expect(result.current.isInitialLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledWith({
      enterpriseCustomerUuid: mockEnterpriseId,
      policyUuid: undefined,
    });
    expect(result.current.data).toEqual({
      policyUuid: mockPolicyUuid,
      isEligible: false,
      reasons: [{ errorCode: 'budget_expiring_soon', message: 'The budget expires in fewer than 14 days.' }],
      subsidyExpirationDatetime: '2026-11-03T11:38:00Z',
    });
  });

  it('shares one enterprise-wide request between budgets', async () => {
    const client = queryClient();
    const first = renderUseTopUpEligibility({}, client);
    const second = renderUseTopUpEligibility({ policyUuid: mockOtherPolicyUuid }, client);

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledTimes(1);
    expect(first.result.current.data.policyUuid).toBe(mockPolicyUuid);
    expect(second.result.current.data.policyUuid).toBe(mockOtherPolicyUuid);
  });

  it('requests a single budget with policy_uuid', async () => {
    const { result } = renderUseTopUpEligibility({ isSingleBudgetRequest: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledWith({
      enterpriseCustomerUuid: mockEnterpriseId,
      policyUuid: mockPolicyUuid,
    });
  });

  it('returns null when the response has no row for the budget', async () => {
    const { result } = renderUseTopUpEligibility({ policyUuid: 'not-in-results' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it.each([403, 404])('does not retry a %s', async (status) => {
    EnterpriseAccessApiService.getTopUpEligibility.mockRejectedValue(httpError(status));
    const { result } = renderUseTopUpEligibility();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeUndefined();
  });

  it('retries a 5xx once', async () => {
    EnterpriseAccessApiService.getTopUpEligibility.mockRejectedValue(httpError(503));
    const { result } = renderUseTopUpEligibility();

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });
    expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledTimes(2);
  });

  it.each([
    { scenario: 'the feature flag is off', setup: () => { features.TOP_UP_LEARNER_CREDIT = false; } },
    { scenario: 'there is no policy', args: { policyUuid: undefined } },
    { scenario: 'the caller disables it', args: { enabled: false } },
  ])('does not request eligibility when $scenario', ({ setup, args }) => {
    setup?.();
    const { result } = renderUseTopUpEligibility(args);

    expect(result.current.isInitialLoading).toBe(false);
    expect(EnterpriseAccessApiService.getTopUpEligibility).not.toHaveBeenCalled();
  });
});
