import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SubscriptionLifecycle from '../SubscriptionLifecycle';
import * as hooks from '../data/hooks';

jest.mock('../data/hooks');

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';
const mockStore = configureMockStore([thunk]);

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
  const store = mockStore({
    portalConfiguration: {
      productType,
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <SubscriptionLifecycle
            enterpriseUuid={TEST_ENTERPRISE_UUID}
          />
        </IntlProvider>
      </QueryClientProvider>
    </Provider>,
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

  it('renders Teams for teams product type', () => {
    renderSubscriptionLifecycle('teams');

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('falls back to Unknown when product type is missing', () => {
    renderSubscriptionLifecycle(null);

    expect(screen.getByText('Subscription Type')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
