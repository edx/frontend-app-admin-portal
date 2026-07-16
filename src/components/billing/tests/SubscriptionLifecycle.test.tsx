import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SubscriptionLifecycle from '../SubscriptionLifecycle';
import * as hooks from '../data/hooks';

jest.mock('../data/hooks');

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';

const mockSubscription = {
  yearlyAmount: 120000,
  currency: 'usd',
  licenseCount: 25,
  currentPeriodEnd: 1735689600,
  cancelAtPeriodEnd: false,
};

const renderSubscriptionLifecycle = (productType: string | null) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale="en">
        <SubscriptionLifecycle
          enterpriseUuid={TEST_ENTERPRISE_UUID}
          productType={productType}
        />
      </IntlProvider>
    </QueryClientProvider>,
  );
};

describe('SubscriptionLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (hooks.useSubscription as jest.Mock).mockReturnValue({
      data: mockSubscription,
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

  it('renders Essentials for essentials product type (case-insensitive)', () => {
    renderSubscriptionLifecycle('ESSENTIALS');

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Essentials')).toBeInTheDocument();
  });

  it('falls back to Teams when product type is missing', () => {
    renderSubscriptionLifecycle(null);

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });
});
