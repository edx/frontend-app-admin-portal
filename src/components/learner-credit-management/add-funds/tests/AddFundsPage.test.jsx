import React, { StrictMode } from 'react';
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
import { BUDGET_STATUSES } from '../../../EnterpriseApp/data/constants';
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
  status: BUDGET_STATUSES.active,
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

const BrowserForwardButton = () => {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(1)}>Browser forward</button>;
};

const learnerCreditPath = `/${enterpriseSlug}/admin/learner-credit`;

const renderAddFunds = ({
  budgetId = mockBudgetUuid, step, previousEntries = [], nextEntries = [], wrapper,
} = {}) => render(
  <QueryClientProvider client={queryClient()}>
    <IntlProvider locale="en">
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[
            ...previousEntries,
            step ? `${addFundsBasePath(budgetId)}/${step}` : addFundsBasePath(budgetId),
            ...nextEntries,
          ]}
          initialIndex={previousEntries.length}
        >
          <Routes>
            <Route path="/:enterpriseSlug/admin/learner-credit/*" element={<LearnerCreditManagementRoutes />} />
          </Routes>
          <LocationDisplay />
          <BrowserBackButton />
          <BrowserForwardButton />
        </MemoryRouter>
      </Provider>
    </IntlProvider>
  </QueryClientProvider>,
  { wrapper },
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
    expect(screen.getByRole('heading', { name: 'Select an Amount' })).toBeInTheDocument();
  });

  it('renders breadcrumbs, stepper and an empty order summary', () => {
    renderAddFunds();
    expect(screen.getByRole('link', { name: 'Learner Credit' })).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/learner-credit`,
    );
    expect(screen.getByRole('link', { name: mockBudgetDisplayName })).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`,
    );
    ['Select Amount', 'Payment Method', 'Payment Details', 'Confirmation'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.getByText('$1,800.00')).toBeInTheDocument();
    expect(screen.getByText('March 15, 3027')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
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
    expect(screen.getByRole('heading', { name: 'Select an Amount' })).toBeInTheDocument();
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
    expect(screen.queryByRole('heading', { name: 'Select an Amount' })).not.toBeInTheDocument();
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });

  it.each([
    { scenario: 'the feature flag is off', setup: () => { features.TOP_UP_LEARNER_CREDIT = false; } },
    { scenario: 'the budget is not a policy', budgetId: '123' },
    ...[
      { status: 'retired', overrides: { status: BUDGET_STATUSES.retired, isRetiredOrExpired: true } },
      { status: 'expired', overrides: { status: BUDGET_STATUSES.expired, isRetiredOrExpired: true } },
      { status: 'scheduled', overrides: { status: BUDGET_STATUSES.scheduled } },
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
    expect(screen.queryByRole('heading', { name: 'Select an Amount' })).not.toBeInTheDocument();
  });

  it('selects a preset amount and updates the order summary', async () => {
    const user = userEvent.setup();
    renderAddFunds();

    const presetButton = screen.getByRole('button', { name: '$ 5000' });
    await user.click(presetButton);

    expect(presetButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('-$500.00')).toBeInTheDocument();
    expect(screen.getByText('$4,500.00')).toBeInTheDocument();
    expect(screen.getByText('$6,800.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('validates the custom amount against the min and max limits', async () => {
    const user = userEvent.setup();
    renderAddFunds();
    const input = screen.getByLabelText('Custom amount');

    await user.type(input, '100');
    expect(screen.getByText('Enter an amount between $500 and $20,000.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await user.clear(input);
    await user.type(input, '1500');
    expect(screen.queryByText('Enter an amount between $500 and $20,000.')).not.toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('rejects custom amounts just outside the limits and non-whole-dollar amounts', async () => {
    const user = userEvent.setup();
    renderAddFunds();
    const input = screen.getByLabelText('Custom amount');

    // eslint-disable-next-line no-restricted-syntax
    for (const value of ['499', '20001', '500.5']) {
      // eslint-disable-next-line no-await-in-loop
      await user.clear(input);
      // eslint-disable-next-line no-await-in-loop
      await user.type(input, value);
      expect(screen.getByText('Enter an amount between $500 and $20,000.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const value of ['500', '20000']) {
      // eslint-disable-next-line no-await-in-loop
      await user.clear(input);
      // eslint-disable-next-line no-await-in-loop
      await user.type(input, value);
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    }
  });

  it('gives each step its own URL, preserves the selection, and moves focus to each step heading', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount' });
    expectPath('select-amount');

    await user.click(screen.getByRole('button', { name: '$ 1000' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expectPath('payment-method');
    expect(screen.getByRole('heading', { name: 'Payment Method' })).toHaveFocus();
    expect(screen.getByText(/This step is under development/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expectPath('payment-details');
    expect(screen.getByRole('heading', { name: 'Payment Details' })).toBeInTheDocument();
    // Confirmation is unreachable until payment submission is implemented.
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expectPath('payment-method');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expectPath('select-amount');
    expect(screen.getByRole('heading', { name: 'Select an Amount' })).toHaveFocus();
    expect(screen.getByRole('button', { name: '$ 1000' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not move focus to the step heading on initial load under StrictMode', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount', wrapper: StrictMode });
    expect(screen.getByRole('heading', { name: 'Select an Amount' })).not.toHaveFocus();

    await user.click(screen.getByRole('button', { name: '$ 1000' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Payment Method' })).toHaveFocus();
  });

  it('steps back through history instead of adding entries when Back is clicked', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount', previousEntries: [learnerCreditPath] });

    await user.click(screen.getByRole('button', { name: '$ 1000' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expectPath('payment-method');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expectPath('select-amount');

    // Browser Back leaves the flow rather than returning to payment-method.
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(screen.getByTestId('multiple-budgets-page')).toBeInTheDocument();
  });

  it('does not re-enter the flow on browser Back after leaving it from a later step', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount', previousEntries: [learnerCreditPath] });

    await user.click(screen.getByRole('button', { name: '$ 1000' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('budget-detail-page')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(screen.getByTestId('multiple-budgets-page')).toBeInTheDocument();
  });

  it('replaces the current entry on Back when the previous step is not behind it in history', async () => {
    const user = userEvent.setup();
    renderAddFunds({
      step: 'select-amount',
      previousEntries: [learnerCreditPath],
      nextEntries: [`${addFundsBasePath()}/payment-method`],
    });
    await user.click(screen.getByRole('button', { name: '$ 1000' }));
    // Arrive at payment-method through history, not Continue, so there is no "came from" state.
    await user.click(screen.getByRole('button', { name: 'Browser forward' }));
    expectPath('payment-method');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expectPath('select-amount');

    // Back replaced the entry instead of pushing one, so browser Back does not return to payment-method.
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expectPath('select-amount');
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(screen.getByTestId('multiple-budgets-page')).toBeInTheDocument();
  });

  it('supports browser history navigation between steps', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount' });

    await user.click(screen.getByRole('button', { name: '$ 2500' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expectPath('payment-method');

    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expectPath('select-amount');
    expect(screen.getByRole('button', { name: '$ 2500' })).toHaveAttribute('aria-pressed', 'true');
  });

  it.each([
    { scenario: 'no step is given', step: undefined },
    { scenario: 'the step is unknown', step: 'not-a-step' },
    { scenario: 'deep linking to a later step without completing earlier ones', step: 'payment-method' },
    { scenario: 'deep linking to confirmation', step: 'confirmation' },
  ])('redirects to the select amount step when $scenario', ({ step }) => {
    renderAddFunds({ step });
    expectPath('select-amount');
    expect(screen.getByRole('heading', { name: 'Select an Amount' })).toBeInTheDocument();
  });

  it('returns to budget detail when Back is clicked on the first step, leaving the flow', async () => {
    const user = userEvent.setup();
    renderAddFunds({ step: 'select-amount', previousEntries: [`${learnerCreditPath}/${mockBudgetUuid}`] });

    await user.click(screen.getByRole('button', { name: '$ 1000' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('budget-detail-page')).toBeInTheDocument();

    // Back popped the step Continue pushed and leaving replaced the remaining flow entry, so
    // browser Back doesn't re-enter the flow.
    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(screen.getByTestId('location')).not.toHaveTextContent('/add-funds');
  });

  it('is accessible', async () => {
    const { container } = renderAddFunds();
    const results = await axe(container, {
      ...accessibilitySettings,
      rules: {
        ...accessibilitySettings.rules,
        // TODO(ENT-XXXXX): Paragon's <Breadcrumb> renders `<li role="presentation">` separators
        // inside its <ol>, which trips axe's `list` rule. This is Paragon-owned markup, so the rule
        // is disabled for this test only; the rest of the breadcrumb is still audited.
        list: { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
