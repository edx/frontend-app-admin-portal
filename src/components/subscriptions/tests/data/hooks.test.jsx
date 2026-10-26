import { renderHook, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { logError } from '@edx/frontend-platform/logging';

import LicenseManagerApiService from '../../../../data/services/LicenseManagerAPIService';
import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import {
  useStripeSubscriptionPlanInfo,
  useSubscriptionData,
  useSubscriptionUsersOverview,
  useStripeEventsBySubscription,
} from '../../data/hooks';
import { SELF_SERVICE_PAID, SELF_SERVICE_TRIAL } from '../../data/constants';

const TEST_SUBSCRIPTION_PLAN_UUID = 'test-plan-uuid-1';

jest.mock('../../../../data/services/LicenseManagerAPIService', () => ({
  __esModule: true,
  default: {
    fetchCustomerAgreementData: jest.fn(),
    fetchSubscriptionUsersOverview: jest.fn(),
  },
}));

jest.mock('../../../../data/services/EnterpriseAccessApiService', () => ({
  __esModule: true,
  default: {
    fetchStripeEvent: jest.fn(),
  },
}));

jest.mock('@edx/frontend-platform/logging', () => ({
  ...jest.requireActual('@edx/frontend-platform/logging'),
  logError: jest.fn(),
}));

jest.mock('../../../../utils', () => ({
  camelCaseObject: jest.fn(obj => obj), // just return as-is for simplicity
}));

describe('useSubscriptionUsersOverview', () => {
  const mockResponse = {
    data: [
      { status: 'activated', count: 10 },
      { status: 'assigned', count: 5 },
      { status: 'revoked', count: 1 },
    ],
  };
  const mockExpectedOverview = {
    all: 16,
    activated: 10,
    assigned: 5,
    revoked: 1,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('without search argument', async () => {
    const mockPromiseResolve = Promise.resolve(mockResponse);
    LicenseManagerApiService.fetchSubscriptionUsersOverview.mockReturnValue(mockPromiseResolve);

    const args = {
      subscriptionUUID: TEST_SUBSCRIPTION_PLAN_UUID,
      search: null,
      errors: {},
      setErrors: jest.fn(),
    };
    const { result } = renderHook(() => useSubscriptionUsersOverview(args));

    await waitFor(() => {
      expect(LicenseManagerApiService.fetchSubscriptionUsersOverview).toHaveBeenCalledTimes(1);
      expect(LicenseManagerApiService.fetchSubscriptionUsersOverview).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION_PLAN_UUID,
        {},
      );
      expect(result.current[0]).toStrictEqual(
        expect.objectContaining(mockExpectedOverview),
      );
    });
  });

  test('with search argument', async () => {
    const mockPromiseResolve = Promise.resolve(mockResponse);
    LicenseManagerApiService.fetchSubscriptionUsersOverview.mockReturnValue(mockPromiseResolve);

    const args = {
      subscriptionUUID: TEST_SUBSCRIPTION_PLAN_UUID,
      search: 'query',
      errors: {},
      setErrors: jest.fn(),
    };

    const { result } = renderHook(() => useSubscriptionUsersOverview(args));

    await waitFor(() => {
      expect(LicenseManagerApiService.fetchSubscriptionUsersOverview).toHaveBeenCalledTimes(1);
      expect(LicenseManagerApiService.fetchSubscriptionUsersOverview).toHaveBeenCalledWith(
        TEST_SUBSCRIPTION_PLAN_UUID,
        { search: 'query' },
      );
      expect(result.current[0]).toStrictEqual(
        expect.objectContaining(mockExpectedOverview),
      );
    });
  });
});

describe('useStripeSubscriptionPlanInfo', () => {
  const TEST_PLAN_UUID = 'test-plan-uuid-1';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('fetches StripeEventSummary successfully for trial plan', async () => {
    const mockResponse = {
      data: {
        upcoming_invoice_amount_due: 15000,
        currency: 'usd',
        canceled_date: null,
        is_canceled: false,
        renewed_subscription_plan_uuid: null,
      },
    };

    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(mockResponse);

    const setErrors = jest.fn();

    const { result } = renderHook(() => useStripeSubscriptionPlanInfo({
      subPlanUuid: TEST_PLAN_UUID,
      setErrors,
    }));

    await waitFor(() => {
      expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledTimes(1);
      expect(result.current.invoiceAmount).toBe(150);
      expect(result.current.currency).toBe('usd');
      expect(result.current.canceledDate).toBe(null);
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.renewedSubscriptionPlanUuid).toBe(null);
      expect(result.current.loadingStripeSummary).toBe(false);
      expect(setErrors).not.toHaveBeenCalled();
    });
  });

  test('fetches StripeEventSummary with cancellation information ', async () => {
    const mockResponse = {
      data: {
        upcoming_invoice_amount_due: null,
        currency: null,
        canceled_date: '2025-09-15T19:56:09Z',
        is_canceled: false,
        renewed_subscription_plan_uuid: null,
      },
    };

    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(mockResponse);

    const setErrors = jest.fn();

    const { result } = renderHook(() => useStripeSubscriptionPlanInfo({
      subPlanUuid: TEST_PLAN_UUID,
      setErrors,
    }));

    await waitFor(() => {
      expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledTimes(1);
      expect(result.current.invoiceAmount).toBe(null);
      expect(result.current.currency).toBe(null);
      expect(result.current.canceledDate).toBe('2025-09-15T19:56:09Z');
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.renewedSubscriptionPlanUuid).toBe(null);
      expect(result.current.loadingStripeSummary).toBe(false);
      expect(setErrors).not.toHaveBeenCalled();
    });
  });

  test('fetches StripeEventSummary with isCanceled=true and renewedSubscriptionPlanUuid set', async () => {
    const mockResponse = {
      data: {
        upcoming_invoice_amount_due: null,
        currency: null,
        canceled_date: null,
        is_canceled: true,
        renewed_subscription_plan_uuid: 'renewed-plan-uuid',
      },
    };

    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(mockResponse);

    const setErrors = jest.fn();

    const { result } = renderHook(() => useStripeSubscriptionPlanInfo({
      subPlanUuid: TEST_PLAN_UUID,
      setErrors,
    }));

    await waitFor(() => {
      expect(result.current.isCanceled).toBe(true);
      expect(result.current.renewedSubscriptionPlanUuid).toBe('renewed-plan-uuid');
      expect(result.current.loadingStripeSummary).toBe(false);
    });
  });

  test('fetches StripeEventSummary with 404 error ', async () => {
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue({ status: 404 });

    const setErrors = jest.fn();

    const { result } = renderHook(() => useStripeSubscriptionPlanInfo({
      subPlanUuid: TEST_PLAN_UUID,
      setErrors,
    }));

    await waitFor(() => {
      expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledTimes(1);
      expect(result.current.invoiceAmount).toBe(null);
      expect(result.current.currency).toBe(null);
      expect(result.current.canceledDate).toBe(null);
      expect(result.current.isCanceled).toBe(false);
      expect(result.current.renewedSubscriptionPlanUuid).toBe(null);
      expect(result.current.loadingStripeSummary).toBe(false);
      // doesn't return an error if it's 404, just null values
      expect(setErrors).not.toHaveBeenCalled();
    });
  });
});

describe('useStripeEventsBySubscription', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const trialSub = uuid => ({ uuid, planType: SELF_SERVICE_TRIAL });
  const makeSubscriptions = (uuids) => ({
    results: uuids.map(trialSub),
  });
  const make404Error = () => Object.assign(
    new Error('Axios Error (Response): 404 - See custom attributes for details.'),
    { customAttributes: { httpErrorStatus: 404 } },
  );

  test('fetches Stripe info for all subscriptions in parallel', async () => {
    const uuid1 = 'uuid-1';
    const uuid2 = 'uuid-2';
    EnterpriseAccessApiService.fetchStripeEvent.mockImplementation(uuid => Promise.resolve({
      data: {
        upcoming_invoice_amount_due: 5000,
        currency: 'usd',
        canceled_date: null,
        is_canceled: false,
        renewed_subscription_plan_uuid: null,
        uuid,
      },
    }));

    const setErrors = jest.fn();
    const subscriptions = makeSubscriptions([uuid1, uuid2]);
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledTimes(2);
      expect(result.current.stripeInfoByUuid).toHaveProperty(uuid1);
      expect(result.current.stripeInfoByUuid).toHaveProperty(uuid2);
      expect(result.current.loadingStripeInfo).toBe(false);
    });
  });

  test('keeps loadingStripeInfo=true while subscriptionsLoading=true, preventing flicker', async () => {
    const setErrors = jest.fn();
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue({
      data: {
        upcoming_invoice_amount_due: 0, currency: 'usd', canceled_date: null, is_canceled: false, renewed_subscription_plan_uuid: null,
      },
    });

    const { result, rerender } = renderHook(
      ({ subs, subsLoading }) => useStripeEventsBySubscription({
        subscriptions: subs,
        subscriptionsLoading: subsLoading,
        setErrors,
      }),
      { initialProps: { subs: { results: [] }, subsLoading: true } },
    );

    // While subscriptions are still loading, loadingStripeInfo must stay true (no early false)
    await waitFor(() => {
      expect(result.current.loadingStripeInfo).toBe(true);
      expect(EnterpriseAccessApiService.fetchStripeEvent).not.toHaveBeenCalled();
    });

    // Subscriptions finish loading with results — loading should remain true until Stripe resolves
    rerender({ subs: { results: [trialSub('uuid-1')] }, subsLoading: false });
    expect(result.current.loadingStripeInfo).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingStripeInfo).toBe(false);
      expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledTimes(1);
    });
  });

  test('sets loadingStripeInfo=false and clears stripeInfoByUuid when subscriptions is empty', async () => {
    const setErrors = jest.fn();
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions: { results: [] },
      setErrors,
    }));

    await waitFor(() => {
      expect(result.current.loadingStripeInfo).toBe(false);
      expect(result.current.stripeInfoByUuid).toEqual({});
      expect(EnterpriseAccessApiService.fetchStripeEvent).not.toHaveBeenCalled();
    });
  });

  test('resets loadingStripeInfo to true when subscriptions changes and a new fetch begins', async () => {
    const uuid1 = 'uuid-reload-1';
    const uuid2 = 'uuid-reload-2';
    const stripeResponseUuid2 = {
      data: {
        upcoming_invoice_amount_due: 0,
        currency: 'usd',
        canceled_date: null,
        is_canceled: false,
        renewed_subscription_plan_uuid: null,
        uuid: uuid2,
      },
    };
    const stripeResponseUuid1 = {
      data: {
        upcoming_invoice_amount_due: 100,
        currency: 'usd',
        canceled_date: null,
        is_canceled: false,
        renewed_subscription_plan_uuid: null,
        uuid: uuid1,
      },
    };

    let resolveFirst;
    EnterpriseAccessApiService.fetchStripeEvent
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
      .mockResolvedValue(stripeResponseUuid2);

    const setErrors = jest.fn();
    let subscriptions = { results: [trialSub(uuid1)] };
    const { result, rerender } = renderHook(
      ({ subs }) => useStripeEventsBySubscription({ subscriptions: subs, setErrors }),
      { initialProps: { subs: subscriptions } },
    );

    // While first fetch is in-flight, loadingStripeInfo should be true
    expect(result.current.loadingStripeInfo).toBe(true);

    // Resolve first fetch so the hook settles
    resolveFirst(stripeResponseUuid1);
    await waitFor(() => expect(result.current.loadingStripeInfo).toBe(false));

    // Re-render with new subscriptions — loadingStripeInfo must go back to true
    subscriptions = { results: [trialSub(uuid2)] };
    rerender({ subs: subscriptions });
    expect(result.current.loadingStripeInfo).toBe(true);

    await waitFor(() => expect(result.current.loadingStripeInfo).toBe(false));
  });

  test('ignores stale response when subscriptions change mid-flight', async () => {
    const uuid1 = 'uuid-stale';
    const uuid2 = 'uuid-fresh';
    let resolveStale;
    const staleResponse = {
      data: {
        upcoming_invoice_amount_due: 9999, currency: 'usd', canceled_date: null, is_canceled: false, renewed_subscription_plan_uuid: null,
      },
    };
    const freshResponse = {
      data: {
        upcoming_invoice_amount_due: 1111, currency: 'usd', canceled_date: null, is_canceled: false, renewed_subscription_plan_uuid: null,
      },
    };

    // First call (uuid1) is held; second call (uuid2) resolves immediately
    EnterpriseAccessApiService.fetchStripeEvent
      .mockImplementationOnce(() => new Promise(resolve => { resolveStale = resolve; }))
      .mockResolvedValue(freshResponse);

    const setErrors = jest.fn();
    const { result, rerender } = renderHook(
      ({ subs }) => useStripeEventsBySubscription({ subscriptions: subs, setErrors }),
      { initialProps: { subs: { results: [trialSub(uuid1)] } } },
    );

    // Change subscriptions before the first fetch resolves — triggers cleanup
    rerender({ subs: { results: [trialSub(uuid2)] } });

    await waitFor(() => expect(result.current.loadingStripeInfo).toBe(false));

    // Now resolve the stale request — should be a no-op
    resolveStale(staleResponse);
    await new Promise(r => { setTimeout(r, 50); });

    expect(result.current.stripeInfoByUuid).toHaveProperty(uuid2);
    expect(result.current.stripeInfoByUuid).not.toHaveProperty(uuid1);
  });

  test('computes suppressedSubscriptionUuids when isCanceled=true (tested via useSubscriptionData integration)', async () => {
    // This test verifies the raw stripeInfoByUuid data from the hook
    const trialUuid = 'trial-uuid';
    const renewedUuid = 'renewed-uuid';
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue({
      data: {
        upcoming_invoice_amount_due: null,
        currency: null,
        canceled_date: null,
        is_canceled: true,
        renewed_subscription_plan_uuid: renewedUuid,
      },
    });

    const setErrors = jest.fn();
    const subscriptions = makeSubscriptions([trialUuid]);
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      expect(result.current.stripeInfoByUuid[trialUuid]).toMatchObject({
        isCanceled: true,
        renewedSubscriptionPlanUuid: renewedUuid,
      });
      expect(result.current.loadingStripeInfo).toBe(false);
    });
  });

  test('sets STRIPE_EVENT_SUMMARY error, resets stripeInfoByUuid to null map, and sets loadingStripeInfo=false when fetchAll rejects', async () => {
    const syncError = new Error('Unexpected sync error');
    // Throwing synchronously inside the map causes fetchAll() to reject, triggering .catch
    EnterpriseAccessApiService.fetchStripeEvent.mockImplementation(() => { throw syncError; });

    const setErrors = jest.fn();
    const subscriptions = makeSubscriptions(['uuid-1']);
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(syncError);
      expect(setErrors).toHaveBeenCalledTimes(1);
      expect(result.current.loadingStripeInfo).toBe(false);
      // stale Stripe data must not persist — current UUIDs are mapped to null
      expect(result.current.stripeInfoByUuid).toEqual({ 'uuid-1': null });
    });
  });

  test('logs error and sets STRIPE_EVENT_SUMMARY when one fetchStripeEvent rejects asynchronously (partial success)', async () => {
    const networkError = new Error('Network error');
    const uuid1 = 'uuid-success';
    const uuid2 = 'uuid-fail';
    const successResponse = {
      data: {
        upcoming_invoice_amount_due: 5000,
        currency: 'usd',
        canceled_date: null,
        is_canceled: false,
        renewed_subscription_plan_uuid: null,
      },
    };
    EnterpriseAccessApiService.fetchStripeEvent
      .mockResolvedValueOnce(successResponse)
      .mockRejectedValueOnce(networkError);

    const setErrors = jest.fn();
    const subscriptions = makeSubscriptions([uuid1, uuid2]);
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      // The successful fetch is preserved
      expect(result.current.stripeInfoByUuid[uuid1]).not.toBeNull();
      // The failed fetch is stored as null
      expect(result.current.stripeInfoByUuid).toHaveProperty(uuid2, null);
      // The rejection is logged
      expect(logError).toHaveBeenCalledWith(networkError);
      // The error state is set exactly once
      expect(setErrors).toHaveBeenCalledTimes(1);
      expect(result.current.loadingStripeInfo).toBe(false);
    });
  });

  test('normalizes upcomingInvoiceAmountDue from cents to dollars as invoiceAmountDue', async () => {
    const uuid1 = 'uuid-normalize';
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue({
      data: {
        upcoming_invoice_amount_due: 500000,
        currency: 'usd',
        canceled_date: null,
        is_canceled: false,
        renewed_subscription_plan_uuid: null,
      },
    });

    const setErrors = jest.fn();
    const subscriptions = makeSubscriptions([uuid1]);
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      expect(result.current.stripeInfoByUuid[uuid1]).toMatchObject({ invoiceAmountDue: 5000 });
      expect(result.current.stripeInfoByUuid[uuid1]).not.toHaveProperty('upcomingInvoiceAmountDue');
    });
  });

  test('stores null for subscriptions when API returns no data', async () => {
    const uuid1 = 'uuid-no-data';
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue({});

    const setErrors = jest.fn();
    const subscriptions = makeSubscriptions([uuid1]);
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      // A response with no .data stores uuid1 as null (key present, value null)
      // This allows SubscriptionCard to detect the fetch completed (not still loading)
      expect(result.current.stripeInfoByUuid).toHaveProperty(uuid1, null);
      expect(result.current.loadingStripeInfo).toBe(false);
    });
  });

  test('stores null without logging or setting an error when the API responds 404', async () => {
    const uuid1 = 'uuid-404';
    EnterpriseAccessApiService.fetchStripeEvent.mockRejectedValue(make404Error());

    const setErrors = jest.fn();
    const subscriptions = makeSubscriptions([uuid1]);
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      expect(result.current.stripeInfoByUuid).toHaveProperty(uuid1, null);
      expect(result.current.loadingStripeInfo).toBe(false);
    });
    expect(logError).not.toHaveBeenCalled();
    expect(setErrors).not.toHaveBeenCalled();
  });

  test('only fetches Stripe info for self-service plans and stores null for sales-provisioned plans', async () => {
    const trialUuid = 'uuid-ssp-trial';
    const paidUuid = 'uuid-ssp-paid';
    const salesUuid = 'uuid-sales';
    EnterpriseAccessApiService.fetchStripeEvent.mockImplementation(uuid => (
      uuid === trialUuid
        ? Promise.resolve({
          data: {
            upcoming_invoice_amount_due: 5000,
            currency: 'usd',
            canceled_date: null,
            is_canceled: false,
            renewed_subscription_plan_uuid: paidUuid,
          },
        })
        : Promise.reject(make404Error())
    ));

    const setErrors = jest.fn();
    const subscriptions = {
      results: [
        { uuid: trialUuid, planType: SELF_SERVICE_TRIAL },
        { uuid: paidUuid, planType: SELF_SERVICE_PAID },
        { uuid: salesUuid, planType: 'Standard Paid' },
      ],
    };
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      expect(result.current.loadingStripeInfo).toBe(false);
    });
    expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledTimes(2);
    expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledWith(trialUuid);
    expect(EnterpriseAccessApiService.fetchStripeEvent).toHaveBeenCalledWith(paidUuid);
    expect(EnterpriseAccessApiService.fetchStripeEvent).not.toHaveBeenCalledWith(salesUuid);
    expect(result.current.stripeInfoByUuid[trialUuid]).toMatchObject({ invoiceAmountDue: 50 });
    expect(result.current.stripeInfoByUuid).toHaveProperty(paidUuid, null);
    expect(result.current.stripeInfoByUuid).toHaveProperty(salesUuid, null);
    expect(logError).not.toHaveBeenCalled();
    expect(setErrors).not.toHaveBeenCalled();
  });

  test('stores null for every plan without fetching when no plans are self-service', async () => {
    const setErrors = jest.fn();
    const subscriptions = {
      results: [
        { uuid: 'uuid-sales-1', planType: 'Standard Paid' },
        { uuid: 'uuid-sales-2', planType: 'Trial' },
      ],
    };
    const { result } = renderHook(() => useStripeEventsBySubscription({
      subscriptions,
      setErrors,
    }));

    await waitFor(() => {
      expect(result.current.loadingStripeInfo).toBe(false);
      expect(result.current.stripeInfoByUuid).toEqual({ 'uuid-sales-1': null, 'uuid-sales-2': null });
    });
    expect(EnterpriseAccessApiService.fetchStripeEvent).not.toHaveBeenCalled();
    expect(setErrors).not.toHaveBeenCalled();
  });
});

describe('useSubscriptionData', () => {
  const enterpriseId = 'test-enterprise-uuid';
  const trialUuid = 'trial-sub-uuid';
  const renewedUuid = 'renewed-sub-uuid';

  // expirationDate in the future so the trial plan is still "active" in these tests.
  // Tests that cover post-expiry behaviour override this with a past date.
  const TRIAL_EXPIRATION_FUTURE = '2099-01-01T00:00:00Z';
  const TRIAL_EXPIRATION_PAST = '2020-01-01T00:00:00Z';

  const makeCustomerAgreementResponse = ({ expirationDate = TRIAL_EXPIRATION_FUTURE } = {}) => ({
    data: {
      results: [
        {
          subscriptions: [{ uuid: trialUuid, expiration_date: expirationDate, plan_type: SELF_SERVICE_TRIAL }],
          disable_expiration_notifications: false,
          net_days_until_expiration: 10,
        },
      ],
      count: 1,
    },
  });

  const makeStripeResponse = (overrides = {}) => ({
    data: {
      upcoming_invoice_amount_due: null,
      currency: null,
      canceled_date: null,
      is_canceled: false,
      renewed_subscription_plan_uuid: renewedUuid,
      ...overrides,
    },
  });

  beforeEach(() => {
    jest.resetAllMocks();
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValue(
      makeCustomerAgreementResponse(),
    );
  });

  afterEach(() => cleanup());

  test('suppressedSubscriptionUuids includes renewedSubscriptionPlanUuid when isCanceled=true', async () => {
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ is_canceled: true }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.has(renewedUuid)).toBe(true);
    });
  });

  test('suppressedSubscriptionUuids includes renewedSubscriptionPlanUuid when canceledDate is in the future', async () => {
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ canceled_date: '2099-01-01T00:00:00Z', is_canceled: false }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.has(renewedUuid)).toBe(true);
    });
  });

  test('suppressedSubscriptionUuids excludes renewedSubscriptionPlanUuid when neither canceled nor future cancellation', async () => {
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ canceled_date: null, is_canceled: false }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.has(renewedUuid)).toBe(false);
    });
  });

  test('suppressedSubscriptionUuids excludes uuid when canceledDate is in the past and not isCanceled', async () => {
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ canceled_date: '2020-01-01T00:00:00Z', is_canceled: false }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.has(renewedUuid)).toBe(false);
    });
  });

  test('does not suppress paid plan when trial has expired and paid cancellation is scheduled (futureCancellation)', async () => {
    // Scenario: trial ended naturally, customer is on paid plan, then schedules cancellation.
    // The shared renewal record reflects the paid plan's cancel_at, but the trial has already
    // expired — the paid plan is the live plan and must remain visible.
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValue(
      makeCustomerAgreementResponse({ expirationDate: TRIAL_EXPIRATION_PAST }),
    );
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ canceled_date: '2099-01-01T00:00:00Z', is_canceled: false }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.has(renewedUuid)).toBe(false);
    });
  });

  test('does not suppress paid plan and does not crash when trial plan has null expirationDate', async () => {
    // Guard: ownerPlan?.expirationDate prevents dayjs(null) crash.
    // ownerStillActive is falsy when expirationDate is null, so the paid plan stays visible.
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValue(
      makeCustomerAgreementResponse({ expirationDate: null }),
    );
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ is_canceled: true }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.has(renewedUuid)).toBe(false);
    });
  });

  test('returns empty suppressedSubscriptionUuids and does not crash when subscriptions API fails', async () => {
    // Guard: subscriptions?.results early-return keeps suppressedSubscriptionUuids empty
    // when the subscriptions fetch errors and leaves results at the initial empty array.
    LicenseManagerApiService.fetchCustomerAgreementData.mockRejectedValue(new Error('Network error'));
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ is_canceled: true }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.size).toBe(0);
    });
  });

  test('does not suppress paid plan when trial has expired and renewal record is_canceled=true', async () => {
    // Scenario: trial ended, paid plan was fully deleted. The paid plan should still be
    // visible (showing a cancelled state) rather than disappearing from the list.
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValue(
      makeCustomerAgreementResponse({ expirationDate: TRIAL_EXPIRATION_PAST }),
    );
    EnterpriseAccessApiService.fetchStripeEvent.mockResolvedValue(
      makeStripeResponse({ is_canceled: true }),
    );

    const { result } = renderHook(() => useSubscriptionData({ enterpriseId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suppressedSubscriptionUuids.has(renewedUuid)).toBe(false);
    });
  });
});
