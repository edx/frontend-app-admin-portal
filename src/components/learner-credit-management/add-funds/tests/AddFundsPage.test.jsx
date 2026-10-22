import React from 'react';
import {
  MemoryRouter, Route, Routes, useLocation, useNavigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';

import { features } from '../../../../config';
import LearnerCreditManagementRoutes from '../..';
import { useSubsidyAccessPolicy } from '../../data';
import { queryClient } from '../../../test/testUtils';
import { accessibilitySettings } from '../../../../../tests/accessibility-settings';

jest.mock('../../data', () => ({
  ...jest.requireActual('../../data'),
  useSubsidyAccessPolicy: jest.fn(),
}));
jest.mock('../../BudgetDetailPage', () => function MockBudgetDetailPage() {
  return <div data-testid="budget-detail-page" />;
});
jest.mock('../../MultipleBudgetsPage', () => function MockMultipleBudgetsPage() {
  return <div data-testid="multiple-budgets-page" />;
});

const enterpriseSlug = 'test-enterprise';
const mockBudgetUuid = 'a7c2f8e4-1b9d-4c3e-8f2a-6d5b4e3c2a10';
const mockBudgetDisplayName = 'Product & Design Upskilling';

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  portalConfiguration: {
    enterpriseId: 'test-enterprise-uuid',
    enterpriseSlug,
    enterpriseBranding: {},
  },
});

const mockPolicy = (overrides = {}) => ({
  uuid: mockBudgetUuid,
  displayName: mockBudgetDisplayName,
  subsidyActiveDatetime: '2024-01-01T00:00:00Z',
  subsidyExpirationDatetime: '3027-03-15T00:00:00Z',
  retired: false,
  isRetiredOrExpired: false,
  aggregates: { spendAvailableUsd: 1800 },
  ...overrides,
});

const addFundsBasePath = (budgetId = mockBudgetUuid) => `/${enterpriseSlug}/admin/learner-credit/${budgetId}/add-funds`;

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const BrowserBackButton = () => {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Browser back</button>;
};

const renderAddFunds = ({ budgetId = mockBudgetUuid, step } = {}) => render(
  <QueryClientProvider client={queryClient()}>
    <IntlProvider locale="en">
      <Provider store={store}>
        <MemoryRouter initialEntries={[step ? `${addFundsBasePath(budgetId)}/${step}` : addFundsBasePath(budgetId)]}>
          <Routes>
            <Route path="/:enterpriseSlug/admin/learner-credit/*" element={<LearnerCreditManagementRoutes />} />
          </Routes>
          <LocationDisplay />
          <BrowserBackButton />
        </MemoryRouter>
      </Provider>
    </IntlProvider>
  </QueryClientProvider>,
);

const expectPath = (step) => {
  expect(screen.getByTestId('location')).toHaveTextContent(`${addFundsBasePath()}/${step}`);
};

describe('AddFundsPage', () => {
  beforeEach(() => {
    features.TOP_UP_LEARNER_CREDIT = true;
    useSubsidyAccessPolicy.mockReturnValue({
      data: mockPolicy(),
      isInitialLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    features.TOP_UP_LEARNER_CREDIT = false;
  });

  it('matches the add-funds route instead of treating it as a budget detail tab', () => {
    renderAddFunds();
    expect(screen.queryByTestId('budget-detail-page')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Select Amount' })).toBeInTheDocument();
  });

  it('renders breadcrumbs and the stepper', () => {
    renderAddFunds();
    expect(screen.getByRole('link', { name: 'Learner Credit' })).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/learner-credit`,
    );
    expect(screen.getByRole('link', { name: mockBudgetDisplayName })).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`,
    );
    ['Payment Method', 'Payment Details', 'Confirmation'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Select Amount' })).toBeInTheDocument();
    expect(screen.getByText(/This step is under development/)).toBeInTheDocument();
  });

  it('falls back to "Overview" in the breadcrumb when the budget has no display name', () => {
    useSubsidyAccessPolicy.mockReturnValue({
      data: mockPolicy({ displayName: null }), isInitialLoading: false, isError: false,
    });
    renderAddFunds();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`,
    );
  });

  it('shows a loading state', () => {
    useSubsidyAccessPolicy.mockReturnValue({ data: undefined, isInitialLoading: true, isError: false });
    renderAddFunds();
    expect(screen.getByText('Loading add funds')).toBeInTheDocument();
    // The Hero renders while loading too, so it doesn't pop in (layout shift) once the budget loads.
    expect(screen.getByText('Learner Credit Management')).toBeInTheDocument();
  });

  it('keeps showing the loading state when the policy query is paused (e.g., offline)', () => {
    useSubsidyAccessPolicy.mockReturnValue({ data: undefined, isInitialLoading: false, isError: false });
    renderAddFunds();
    expect(screen.getByText('Loading add funds')).toBeInTheDocument();
    expect(screen.queryByTestId('budget-detail-page')).not.toBeInTheDocument();
  });

  it('stays on the flow when a background refetch fails but budget data is cached', () => {
    useSubsidyAccessPolicy.mockReturnValue({
      data: mockPolicy(),
      isInitialLoading: false,
      isError: true,
      error: { customAttributes: { httpErrorStatus: 500 } },
    });
    renderAddFunds({ step: 'select-amount' });
    expect(screen.getByRole('heading', { name: 'Select Amount' })).toBeInTheDocument();
    expect(screen.queryByTestId('budget-detail-page')).not.toBeInTheDocument();
  });

  it('shows the not found page when the budget does not exist', () => {
    useSubsidyAccessPolicy.mockReturnValue({
      data: undefined,
      isInitialLoading: false,
      isError: true,
      error: { customAttributes: { httpErrorStatus: 404 } },
    });
    renderAddFunds();
    expect(screen.queryByRole('heading', { name: 'Select Amount' })).not.toBeInTheDocument();
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });

  it.each([
    { scenario: 'the feature flag is off', setup: () => { features.TOP_UP_LEARNER_CREDIT = false; } },
    { scenario: 'the budget is not a policy', budgetId: '123' },
    ...[
      { status: 'retired', overrides: { retired: true, isRetiredOrExpired: true } },
      { status: 'expired', overrides: { subsidyExpirationDatetime: '2024-06-01T00:00:00Z', isRetiredOrExpired: true } },
      { status: 'scheduled', overrides: { subsidyActiveDatetime: '3026-01-01T00:00:00Z' } },
    ].map(({ status, overrides }) => ({
      scenario: `the budget is ${status}`,
      setup: () => useSubsidyAccessPolicy.mockReturnValue({
        data: mockPolicy(overrides), isInitialLoading: false, isError: false,
      }),
    })),
    {
      scenario: 'the budget fails to load',
      setup: () => useSubsidyAccessPolicy.mockReturnValue({
        data: undefined, isInitialLoading: false, isError: true, error: { customAttributes: { httpErrorStatus: 500 } },
      }),
    },
  ])('redirects to budget detail when $scenario', ({ setup, budgetId }) => {
    setup?.();
    renderAddFunds({ budgetId });
    expect(screen.getByTestId('budget-detail-page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Select Amount' })).not.toBeInTheDocument();
  });

  it('gives each step its own URL and moves focus to each step heading', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount' });
    expectPath('select-amount');

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expectPath('payment-method');
    expect(screen.getByRole('heading', { name: 'Payment Method' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expectPath('payment-details');
    expect(screen.getByRole('heading', { name: 'Payment Details' })).toBeInTheDocument();
    // Confirmation is unreachable until payment submission is implemented.
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expectPath('payment-method');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expectPath('select-amount');
    expect(screen.getByRole('heading', { name: 'Select Amount' })).toHaveFocus();
  });

  it('supports browser history navigation between steps', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount' });

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expectPath('payment-method');

    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expectPath('select-amount');
  });

  it.each([
    { scenario: 'no step is given', step: undefined },
    { scenario: 'the step is unknown', step: 'not-a-step' },
  ])('redirects to the select amount step when $scenario', ({ step }) => {
    renderAddFunds({ step });
    expectPath('select-amount');
    expect(screen.getByRole('heading', { name: 'Select Amount' })).toBeInTheDocument();
  });

  it('redirects a deep link to confirmation back to the first incomplete step', () => {
    renderAddFunds({ step: 'confirmation' });
    expectPath('payment-details');
  });

  it('returns to budget detail when Back is clicked on the first step, leaving the flow', async () => {
    const user = userEvent.setup();
    renderAddFunds();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('budget-detail-page')).toBeInTheDocument();

    // The flow is replaced in history, so browser Back doesn't re-enter it.
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(screen.getByTestId('budget-detail-page')).toBeInTheDocument();
  });

  it('is accessible', async () => {
    const { container } = renderAddFunds();
    // Paragon's <Breadcrumb> renders `<li role="presentation">` separators inside its <ol>, which
    // trips axe's `list` rule. That markup is owned by Paragon, so exclude it from this audit
    // rather than disabling the rule globally.
    container.querySelector('.pgn__breadcrumb')?.remove();
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });
});
