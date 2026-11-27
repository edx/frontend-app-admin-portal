import React from 'react';
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import dayjs from 'dayjs';

import SettingsMultiPlanFundingTab from '..';
import MultiPlanFundingPlanPage from '../MultiPlanFundingPlanPage';
import EnterpriseAccessApiService from '../../../../data/services/EnterpriseAccessApiService';
import { SubsidyRequestsContext } from '../../../subsidy-requests';
import { queryClient } from '../../../test/testUtils';
import { configuration } from '../../../../config';

jest.mock('../../../../data/services/EnterpriseAccessApiService');
jest.mock('@edx/frontend-platform/logging', () => ({ logError: jest.fn(), logInfo: jest.fn() }));

const mockStore = configureMockStore([thunk]);
const enterpriseId = 'test-enterprise-uuid';
const enterpriseSlug = 'test-enterprise';
const HELP_CENTER_URL = 'https://help.example.com/multi-plan-funding';
const future = dayjs().add(1, 'year').toISOString();
const past = dayjs().subtract(1, 'year').toISOString();

const makePolicy = (overrides = {}) => ({
  uuid: 'a1b2c3d4-0000-4000-8000-000000000001',
  display_name: 'Lakshy Team BNR',
  policy_type: 'PerLearnerSpendCreditAccessPolicy',
  bnr_enabled: false,
  retired: false,
  active: true,
  is_multi_plan_eligible: false,
  subsidy_active_datetime: past,
  subsidy_expiration_datetime: future,
  aggregates: { spend_available_usd: 23791, amount_redeemed_usd: 209, amount_allocated_usd: 0 },
  ...overrides,
});

const inPoolPolicy = makePolicy({
  uuid: 'a1b2c3d4-0000-4000-8000-000000000002', display_name: 'ACME - LC - 2026', is_multi_plan_eligible: true,
});
const assignmentPolicy = makePolicy({
  uuid: 'a1b2c3d4-0000-4000-8000-000000000003',
  display_name: 'Assignment budget',
  policy_type: 'AssignedLearnerCreditAccessPolicy',
});

const renderWithProviders = (ui, {
  initialEntries = ['/'],
  path = '/',
  isMultiPlanFundingEnabled = true,
  isCustomerSwitchOn = true,
} = {}) => {
  const store = mockStore({
    portalConfiguration: {
      enterpriseId,
      enterpriseSlug,
      enterpriseFeatures: { enterpriseMultiPlanFundingEnabled: isMultiPlanFundingEnabled },
    },
  });
  return render(
    <IntlProvider locale="en">
      <QueryClientProvider client={queryClient()}>
        <Provider store={store}>
          <SubsidyRequestsContext.Provider
            value={{ subsidyRequestConfiguration: { enableMultiPlanFunding: isCustomerSwitchOn } }}
          >
            <MemoryRouter initialEntries={initialEntries}>
              <Routes>
                <Route path={path} element={ui} />
                <Route path="*" element={<div>Other page</div>} />
              </Routes>
            </MemoryRouter>
          </SubsidyRequestsContext.Provider>
        </Provider>
      </QueryClientProvider>
    </IntlProvider>,
  );
};

describe('<SettingsMultiPlanFundingTab />', () => {
  const originalHelpCenterUrl = configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL = HELP_CENTER_URL;
  });

  afterAll(() => {
    configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL = originalHelpCenterUrl;
  });

  const renderTab = () => renderWithProviders(
    <SettingsMultiPlanFundingTab enterpriseId={enterpriseId} enterpriseSlug={enterpriseSlug} />,
  );

  it('shows a loading state while plans load', () => {
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Plans')).toBeInTheDocument();
    expect(screen.queryByText('Lakshy Team BNR')).not.toBeInTheDocument();
  });

  it('lists plans with their pool status and links to their funding settings', async () => {
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockResolvedValue({
      data: { results: [makePolicy(), inPoolPolicy, assignmentPolicy] },
    });
    renderTab();

    expect(await screen.findByText('Lakshy Team BNR')).toBeInTheDocument();
    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).toHaveBeenCalledWith(enterpriseId, { page: 1 });

    const rowFor = (name) => screen.getByText(name).closest('tr');
    expect(within(rowFor('Lakshy Team BNR')).getByText('Not in Pool')).toBeInTheDocument();
    expect(within(rowFor('Lakshy Team BNR')).getByText('$23,791')).toBeInTheDocument();
    expect(within(rowFor('ACME - LC - 2026')).getByText('In Pool')).toBeInTheDocument();
    expect(within(rowFor('Assignment budget')).getByText('Unavailable')).toBeInTheDocument();

    const settingsLink = screen.getByRole('link', { name: 'Funding settings for Lakshy Team BNR' });
    expect(settingsLink).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/settings/multi_plan_funding/a1b2c3d4-0000-4000-8000-000000000001`,
    );

    const planNameLink = screen.getByRole('link', { name: 'Lakshy Team BNR' });
    expect(planNameLink).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/learner-credit/a1b2c3d4-0000-4000-8000-000000000001`,
    );
  });

  it('shows the help center link, opening in a new tab', async () => {
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockResolvedValue({ data: { results: [] } });
    renderTab();
    const helpLink = screen.getByRole('link', { name: /Learn more about multi-plan funding/ });
    expect(helpLink).toHaveAttribute('href', HELP_CENTER_URL);
    expect(helpLink).toHaveAttribute('target', '_blank');
    expect(within(helpLink).getByText(/in a new tab/i)).toBeInTheDocument();
    expect(await screen.findByText('No active learner credit plans found.')).toBeInTheDocument();
  });

  it('hides the help center link when no URL is configured', () => {
    configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL = undefined;
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.queryByRole('link', { name: /Learn more/ })).not.toBeInTheDocument();
  });

  it('shows an error when plans fail to load', async () => {
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockRejectedValue(new Error('boom'));
    renderTab();
    expect(await screen.findByText(/We couldn’t load your learner credit plans/)).toBeInTheDocument();
  });
});

describe('<MultiPlanFundingPlanPage />', () => {
  const planId = 'a1b2c3d4-0000-4000-8000-000000000001';

  const renderPage = (options = {}) => renderWithProviders(<MultiPlanFundingPlanPage />, {
    initialEntries: [`/settings/multi_plan_funding/${planId}`],
    path: '/settings/multi_plan_funding/:planId',
    ...options,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL = HELP_CENTER_URL;
  });

  it.each([
    { isMultiPlanFundingEnabled: false, isCustomerSwitchOn: true },
    { isMultiPlanFundingEnabled: true, isCustomerSwitchOn: false },
  ])('renders the not found page and makes no request unless enabled (%p)', (options) => {
    renderPage(options);
    expect(screen.queryByText('Funding Settings')).not.toBeInTheDocument();
    expect(EnterpriseAccessApiService.retrieveSubsidyAccessPolicy).not.toHaveBeenCalled();
  });

  it('shows a loading state while the plan loads', () => {
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading plans')).toBeInTheDocument();
  });

  it('shows an error when the plan fails to load', async () => {
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText('We couldn’t find this plan.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plans' })).toBeInTheDocument();
  });

  it('uses the spend limit as the total and counts reserved funds as utilized, like the budget page', async () => {
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({
      data: makePolicy({
        policy_type: 'AssignedLearnerCreditAccessPolicy',
        assignment_configuration: { uuid: 'config-1' },
        spend_limit: 4000000,
        aggregates: { spend_available_usd: 38980, amount_redeemed_usd: 920, amount_allocated_usd: 100 },
      }),
    });
    renderPage();

    expect(await screen.findAllByText('Utilized $1,020')).not.toHaveLength(0);
    expect(screen.getByText(/\$1,020 spent of \$40,000/)).toBeInTheDocument();
  });

  it('shows a Scheduled badge, not Active, for a plan that has not started yet', async () => {
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({
      data: makePolicy({
        subsidy_active_datetime: future,
        subsidy_expiration_datetime: dayjs().add(2, 'year').toISOString(),
      }),
    });
    renderPage();

    expect(await screen.findByText('Scheduled')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('renders plan details, breadcrumbs and the funding settings switch', async () => {
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({ data: makePolicy() });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Lakshy Team BNR' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plans' })).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/settings/multi_plan_funding`,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('$23,791')).toBeInTheDocument();
    expect(screen.getAllByText('Utilized $209').length).toBeGreaterThan(0);
    const switchInput = screen.getByRole('switch', { name: /Add this plan to the shared pool/ });
    expect(switchInput).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    // "How it works" only shows once the plan is in the pool.
    expect(screen.queryByText('How it works')).not.toBeInTheDocument();
  });

  it('asks for confirmation before adding the plan to the pool, then saves and shows a toast', async () => {
    const user = userEvent.setup();
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({ data: makePolicy() });
    EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding.mockResolvedValue({
      data: makePolicy({ is_multi_plan_eligible: true }),
    });
    renderPage();

    await user.click(await screen.findByRole('switch', { name: /Add this plan to the shared pool/ }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    const modal = await screen.findByRole('dialog', { name: 'Add this plan to the multi-plan pool?' });
    expect(within(modal).getByText(/If your Lakshy Team BNR balance isn’t enough/)).toBeInTheDocument();
    expect(EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding).not.toHaveBeenCalled();

    await user.click(within(modal).getByRole('button', { name: 'Enable' }));

    await waitFor(() => expect(
      EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding,
    ).toHaveBeenCalledWith(planId, true));
    expect(await screen.findByText('Funding settings saved')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('How it works')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });

  it('does not save when the confirmation is cancelled and reverts the toggle', async () => {
    const user = userEvent.setup();
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({ data: makePolicy() });
    renderPage();

    const switchInput = await screen.findByRole('switch', { name: /Add this plan to the shared pool/ });
    expect(switchInput).not.toBeChecked();
    await user.click(switchInput);
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding).not.toHaveBeenCalled();
    expect(switchInput).not.toBeChecked();
  });

  it('removes the plan from the pool without a confirmation', async () => {
    const user = userEvent.setup();
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({
      data: makePolicy({ is_multi_plan_eligible: true }),
    });
    EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding.mockResolvedValue({
      data: makePolicy({ is_multi_plan_eligible: false }),
    });
    renderPage();

    const switchInput = await screen.findByRole('switch', { name: /Add this plan to the shared pool/ });
    expect(switchInput).toBeChecked();
    expect(screen.getByText('How it works')).toBeInTheDocument();
    await user.click(switchInput);
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(
      EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding,
    ).toHaveBeenCalledWith(planId, false));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('Funding settings saved')).toBeInTheDocument();
  });

  it('explains when multi-plan funding is turned off for the customer (422)', async () => {
    const user = userEvent.setup();
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({
      data: makePolicy({ is_multi_plan_eligible: true }),
    });
    EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding.mockRejectedValue(
      Object.assign(new Error('Unprocessable'), { customAttributes: { httpErrorStatus: 422 } }),
    );
    renderPage();

    await user.click(await screen.findByRole('switch', { name: /Add this plan to the shared pool/ }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText(/Multi-plan funding isn’t turned on for your organization/)).toBeInTheDocument();
    expect(screen.queryByText('Funding settings saved')).not.toBeInTheDocument();
  });

  it('shows a generic error when saving fails', async () => {
    const user = userEvent.setup();
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({ data: makePolicy() });
    EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding.mockRejectedValue(new Error('boom'));
    renderPage();

    await user.click(await screen.findByRole('switch', { name: /Add this plan to the shared pool/ }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Enable' }));

    expect(await screen.findByText('We couldn’t save your funding settings. Please try again.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('explains why an ineligible plan cannot join the pool', async () => {
    EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockResolvedValue({
      data: makePolicy({ policy_type: 'AssignedLearnerCreditAccessPolicy' }),
    });
    renderPage();

    expect(await screen.findByText(/This plan can’t join the shared pool/)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });
});
