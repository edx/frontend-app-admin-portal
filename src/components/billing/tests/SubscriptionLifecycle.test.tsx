import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SubscriptionLifecycle from '../SubscriptionLifecycle';
import * as hooks from '../data/hooks';
import { features } from '../../../config';

jest.mock('../data/hooks');

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';

const baseMockSubscription = {
  yearlyAmount: 120000,
  currency: 'usd',
  licenseCount: 25,
  currentPeriodEnd: 1735689600,
  cancelAtPeriodEnd: false,
};

const renderSubscriptionLifecycle = (
  productType: string | null | undefined,
  overrides: Record<string, unknown> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  (hooks.useSubscription as jest.Mock).mockReturnValue({
    data: {
      ...baseMockSubscription,
      productType,
      ...overrides,
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale="en">
        <SubscriptionLifecycle
          enterpriseUuid={TEST_ENTERPRISE_UUID}
        />
      </IntlProvider>
    </QueryClientProvider>,
  );
};

describe('SubscriptionLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (hooks.useSubscription as jest.Mock).mockReturnValue({
      data: baseMockSubscription,
    });
    (hooks.useCancelSubscription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    });
    (hooks.useReinstateSubscription as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
    });
  });

  it('renders Essentials for lowercase essentials product type', () => {
    renderSubscriptionLifecycle('essentials');

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Essentials')).toBeInTheDocument();
  });

  it('renders Essentials for capitalized Essentials product type', () => {
    renderSubscriptionLifecycle('Essentials');

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Essentials')).toBeInTheDocument();
  });

  it('renders Teams for lowercase teams product type', () => {
    renderSubscriptionLifecycle('teams');

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('renders Teams for capitalized Teams product type', () => {
    renderSubscriptionLifecycle('Teams');

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('falls back to Teams when product type is null', () => {
    renderSubscriptionLifecycle(null);

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('falls back to Teams when product type is undefined', () => {
    renderSubscriptionLifecycle(undefined);

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  describe('cancellation', () => {
    beforeEach(() => { features.ENABLE_SSP_PAID_RENEWAL = true; });
    afterEach(() => { features.ENABLE_SSP_PAID_RENEWAL = false; });

    it('shows Current Period Ends and no pending status when no cancellation is scheduled', () => {
      renderSubscriptionLifecycle('teams');

      expect(screen.getByText('Current Period Ends')).toBeInTheDocument();
      expect(screen.queryByText('Pending Cancellation')).not.toBeInTheDocument();
      expect(screen.queryByText('Expires On')).not.toBeInTheDocument();
    });

    it('shows a bold Pending Cancellation status and Expires On date when a cancellation is scheduled', () => {
      renderSubscriptionLifecycle('teams', { cancelAtPeriodEnd: true });

      const status = screen.getByText('Pending Cancellation');
      expect(status.closest('.font-weight-bold')).not.toBeNull();
      expect(screen.getByText('Expires On')).toBeInTheDocument();
      expect(screen.queryByText('Current Period Ends')).not.toBeInTheDocument();
      expect(screen.getByText('Reinstate Subscription')).toBeInTheDocument();
    });

    it('cancel modal says enrollments move to Audit and shows the amount and licenses', () => {
      renderSubscriptionLifecycle('teams');

      fireEvent.click(screen.getByText('Cancel Subscription'));

      const body = screen.getByText(/enrollments will move to Audit/);
      expect(body).toHaveTextContent('$1,200.00 / year subscription for 25 licenses');
      expect(body).toHaveTextContent('will not renew');
      expect(screen.queryByText(/lose access/)).not.toBeInTheDocument();
    });
  });

  describe('cancellation with ENABLE_SSP_PAID_RENEWAL off', () => {
    it('shows no Pending Cancellation status and keeps Current Period Ends when a cancellation is scheduled', () => {
      renderSubscriptionLifecycle('teams', { cancelAtPeriodEnd: true });

      expect(screen.queryByText('Pending Cancellation')).not.toBeInTheDocument();
      expect(screen.queryByText('Expires On')).not.toBeInTheDocument();
      expect(screen.getByText('Current Period Ends')).toBeInTheDocument();
      expect(screen.getByText('Reinstate Subscription')).toBeInTheDocument();
    });

    it('cancel modal keeps the old text', () => {
      renderSubscriptionLifecycle('teams');

      fireEvent.click(screen.getByText('Cancel Subscription'));

      expect(screen.getByText(/lose access to all subscription features/)).toBeInTheDocument();
      expect(screen.queryByText(/enrollments will move to Audit/)).not.toBeInTheDocument();
    });
  });
});
