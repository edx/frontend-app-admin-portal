import React from 'react';
import PropTypes from 'prop-types';
import { DataTable } from '@openedx/paragon';

import { useIntl } from '@edx/frontend-platform/i18n';
import TableTextFilter from './TableTextFilter';
import CustomDataTableEmptyState from './CustomDataTableEmptyState';
import SpendTableEnrollmentDetails from './SpendTableEnrollmentDetails';
import SpendTableFundedFromContents from './SpendTableFundedFromContents';

import {
  PAGE_SIZE,
  DEFAULT_PAGE,
  SPENT_TABLE_SEARCH_COLUMN_ACCESSOR,
  formatDate,
  useBudgetId,
  useIsMultiPlanFundingEnabled,
} from './data';
import SpendTableAmountContents from './SpendTableAmountContents';
import { ALLOCATE_LEARNING_BUDGETS_TARGETS } from '../ProductTours/AdminOnboardingTours/constants';

const FilterStatus = (rest) => <DataTable.FilterStatus showFilteredFields={false} {...rest} />;

const LearnerCreditAllocationTable = ({
  isLoading,
  tableData,
  fetchTableData,
  tableActions = [],
}) => {
  const intl = useIntl();
  const { subsidyAccessPolicyId } = useBudgetId();
  const isMultiPlanFundingEnabled = useIsMultiPlanFundingEnabled();
  // Multi-plan learner credit: only subsidy access policy budgets can be split-funded.
  const showFundedFromColumn = isMultiPlanFundingEnabled && !!subsidyAccessPolicyId;
  const fundedFromColumn = {
    Header: (
      <span id={ALLOCATE_LEARNING_BUDGETS_TARGETS.BUDGET_SPENT_FUNDED_FROM}>
        {intl.formatMessage({
          id: 'lcm.learner.credit.allocation.spent.table.column.funded.from',
          defaultMessage: 'Funded From',
          description: 'Column header for the Funded from column in the Learner Credit Allocation table',
        })}
      </span>
    ),
    id: 'fundedFrom',
    Cell: SpendTableFundedFromContents,
    disableFilters: true,
    disableSortBy: true,
  };
  return (
    <DataTable
      isSortable
      manualSortBy
      isPaginated
      manualPagination
      isFilterable
      manualFilters
      isLoading={isLoading}
      defaultColumnValues={{ Filter: TableTextFilter }}
      FilterStatusComponent={FilterStatus}
      tableActions={tableActions}
      columns={[
        {
          Header:
          intl.formatMessage({
            id: 'lcm.learner.credit.allocation.spent.table.column.Date',
            defaultMessage: 'Date',
            description: 'Column header for the Date column in the Learner Credit Allocation table',
          }),
          accessor: 'enrollmentDate',
          Cell: ({ row }) => formatDate(row.values.enrollmentDate),
          disableFilters: true,
        },
        {
          Header:
          intl.formatMessage({
            id: 'lcm.learner.credit.allocation.spent.table.column.enrollment.details',
            defaultMessage: 'Enrollment details',
            description: 'Column header for the Enrollment details column in the Learner Credit Allocation table',
          }),
          accessor: SPENT_TABLE_SEARCH_COLUMN_ACCESSOR,
          Cell: SpendTableEnrollmentDetails,
          disableSortBy: true,
        },
        {
          Header:
          intl.formatMessage({
            id: 'lcm.learner.credit.allocation.spent.table.column.amount',
            defaultMessage: 'Amount',
            description: 'Column header for the Amount column in the Learner Credit Allocation table',
          }),
          accessor: 'courseListPrice',
          Cell: SpendTableAmountContents,
          disableFilters: true,
        },
        {
          Header:
          intl.formatMessage({
            id: 'lcm.learner.credit.allocation.spent.table.column.startDate',
            defaultMessage: 'Start Date',
            description: 'Column header for the Course Run Start Date column in the Learner Credit Allocation table',
          }),
          accessor: 'courseRunStartDate',
          Cell: ({ row }) => {
            const value = row.values.courseRunStartDate;
            return value ? formatDate(value) : null;
          },
          disableFilters: true,
        },
        ...(showFundedFromColumn ? [fundedFromColumn] : []),
      ]}
      initialTableOptions={{
        getRowId: row => row?.uuid?.toString(),
      }}
      initialState={{
        pageSize: PAGE_SIZE,
        pageIndex: DEFAULT_PAGE,
        sortBy: [
          { id: 'enrollmentDate', desc: true },
        ],
        filters: [],
      }}
      fetchData={fetchTableData}
      data={tableData.results}
      itemCount={tableData.itemCount}
      pageCount={tableData.pageCount}
      EmptyTableComponent={CustomDataTableEmptyState}
    />
  );
};

LearnerCreditAllocationTable.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  tableData: PropTypes.shape({
    results: PropTypes.arrayOf(PropTypes.shape({
      userEmail: PropTypes.string,
      courseTitle: PropTypes.string,
      courseListPrice: PropTypes.number.isRequired,
      enrollmentDate: PropTypes.string.isRequired,
    })),
    itemCount: PropTypes.number.isRequired,
    pageCount: PropTypes.number.isRequired,
  }).isRequired,
  fetchTableData: PropTypes.func.isRequired,
  tableActions: PropTypes.arrayOf(PropTypes.node),
};

export default LearnerCreditAllocationTable;
