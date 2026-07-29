import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SubscriptionLifecycle from '../SubscriptionLifecycle';
import * as hooks from '../data/hooks';

jest.mock('../data/hooks');

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';

const baseMockSubscription = {
  yearlyAmount: 120000,
  currency: 'usd',
  licenseCount: 25,
  currentPeriodEnd: 1735689600,
  cancelAtPeriodEnd: false,
};

const renderSubscriptionLifecycle = (productType: string | null | undefined) => {
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
});
