import React from 'react';
import { render, screen } from '@testing-library/react';

import BudgetAssignmentsTable from '../BudgetAssignmentsTable';

jest.mock('@edx/frontend-platform/i18n', () => ({
  ...jest.requireActual('@edx/frontend-platform/i18n'),
  useIntl: () => ({
    formatMessage: ({ defaultMessage }) => defaultMessage,
  }),
}));

jest.mock('../data', () => ({
  DEFAULT_PAGE: 0,
  PAGE_SIZE: 10,
  useBudgetId: jest.fn(() => ({ subsidyAccessPolicyId: 'test-policy-id' })),
  useSubsidyAccessPolicy: jest.fn(() => ({ data: { isRetiredOrExpired: false } })),
}));

// Fix 1: Remove `React` from inside the factory (no-shadow + global-require)
// Instead, just use React.createElement or JSX directly since React is already imported at top
jest.mock('@openedx/paragon', () => {
  const DataTable = ({ columns }) => {
    const learnerStateColumn = columns.find((column) => column.accessor === 'learnerState');
    return (
      <div data-testid="status-filter-choices">
        {JSON.stringify(learnerStateColumn?.filterChoices || [])}
      </div>
    );
  };

  // Fix 2: Use named functions instead of unnamed ones (func-names)
  DataTable.FilterStatus = function FilterStatus() {
    return null;
  };
  DataTable.ControlledSelectHeader = function ControlledSelectHeader() {
    return null;
  };
  DataTable.ControlledSelect = function ControlledSelect() {
    return null;
  };
  DataTable.ControlledSelectionStatus = function ControlledSelectionStatus() {
    return null;
  };

  return { DataTable };
});

describe('<BudgetAssignmentsTable />', () => {
  it('includes Expired in status filter choices when learnerState is expired', () => {
    const tableData = {
      results: [],
      learnerStateCounts: [
        { learnerState: 'expired', count: 1 },
        { learnerState: 'notifying', count: 2 },
      ],
      count: 0,
      numPages: 1,
    };

    render(
      <BudgetAssignmentsTable
        isLoading={false}
        tableData={tableData}
        fetchTableData={jest.fn()}
      />,
    );

    expect(screen.getByTestId('status-filter-choices').textContent).toContain('Expired');
  });
});
