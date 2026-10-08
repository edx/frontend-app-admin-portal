import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { saveAs } from 'file-saver';

import SpentTransactionsCsvDownloadTableAction from '../SpentTransactionsCsvDownloadTableAction';
import EnterpriseAccessApiService from '../../../data/services/EnterpriseAccessApiService';
import { useBudgetId, useSubsidyAccessPolicy } from '../data';

jest.mock('../data', () => ({
  ...jest.requireActual('../data'),
  useBudgetId: jest.fn(),
  useSubsidyAccessPolicy: jest.fn(),
}));
jest.mock('../../../data/services/EnterpriseAccessApiService');
jest.mock('file-saver', () => ({
  ...jest.requireActual('file-saver'),
  saveAs: jest.fn(),
}));

const mockEnterpriseUUID = 'test-enterprise-uuid';
const mockPolicyUUID = 'test-policy-uuid';
const mockSubsidyUUID = 'test-subsidy-uuid';

const defaultTableInstance = {
  itemCount: 2,
  state: { filters: [] },
};

const renderAction = (tableInstance = defaultTableInstance) => render(
  <IntlProvider locale="en">
    <SpentTransactionsCsvDownloadTableAction enterpriseUUID={mockEnterpriseUUID} tableInstance={tableInstance} />
  </IntlProvider>,
);

describe('<SpentTransactionsCsvDownloadTableAction />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBudgetId.mockReturnValue({ subsidyAccessPolicyId: mockPolicyUUID });
    useSubsidyAccessPolicy.mockReturnValue({
      data: { subsidyUuid: mockSubsidyUUID, displayName: 'My Budget' },
    });
  });

  it('downloads the CSV for the budget, applying the table search filter', async () => {
    EnterpriseAccessApiService.exportSubsidyTransactions.mockResolvedValue({ data: 'Learner Email\n' });
    renderAction({
      itemCount: 2,
      state: { filters: [{ id: 'enrollmentDetails', value: 'learner@example.com' }] },
    });

    userEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
    expect(EnterpriseAccessApiService.exportSubsidyTransactions).toHaveBeenCalledWith({
      enterpriseCustomerUuid: mockEnterpriseUUID,
      subsidyUuid: mockSubsidyUUID,
      subsidyAccessPolicyUuid: mockPolicyUUID,
      search: 'learner@example.com',
    });
    expect(saveAs.mock.calls[0][1]).toMatch(/^MyBudget-spent-\d{4}-\d{1,2}-\d{1,2}\.csv$/);
  });

  it.each([
    {
      error: { customAttributes: { httpErrorStatus: 429 } },
      expectedMessage: "You've reached the limit for spend report downloads",
    },
    {
      error: { customAttributes: { httpErrorStatus: 502 } },
      expectedMessage: 'something went wrong while downloading your CSV',
    },
  ])('shows an error modal when the export fails ($error.customAttributes.httpErrorStatus)', async ({
    error, expectedMessage,
  }) => {
    EnterpriseAccessApiService.exportSubsidyTransactions.mockRejectedValue(error);
    renderAction();

    userEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(await screen.findByText(expectedMessage, { exact: false })).toBeInTheDocument();
    expect(saveAs).not.toHaveBeenCalled();
  });

  it('is disabled while the download is pending', async () => {
    let resolveExport;
    EnterpriseAccessApiService.exportSubsidyTransactions.mockReturnValue(
      new Promise((resolve) => { resolveExport = resolve; }),
    );
    renderAction();

    userEvent.click(screen.getByRole('button', { name: 'Download' }));

    // StatefulButton marks its disabled states with aria-disabled rather than the disabled attribute.
    expect(await screen.findByRole('button', { name: 'Downloading' })).toHaveAttribute('aria-disabled', 'true');
    resolveExport({ data: 'Learner Email\n' });
    expect(await screen.findByRole('button', { name: 'Download' })).toHaveAttribute('aria-disabled', 'false');
    expect(saveAs).toHaveBeenCalledTimes(1);
  });

  it.each([
    { description: 'there are no spent transactions', filters: [] },
    { description: 'the search filter matches no transactions', filters: [{ id: 'enrollmentDetails', value: 'nobody' }] },
  ])('is disabled when $description', ({ filters }) => {
    renderAction({ itemCount: 0, state: { filters } });
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('renders nothing when the budget has no subsidy', () => {
    useSubsidyAccessPolicy.mockReturnValue({ data: undefined });
    renderAction();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
  });
});
