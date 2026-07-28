import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
import { useIntl } from '@edx/frontend-platform/i18n';
import { DataTable } from '@openedx/paragon';

import {
  DEFAULT_TABLE_ORDERING,
  DEFAULT_TABLE_PAGE_SIZE,
  getSortStateFromOrdering,
  getTableStateFromSearch,
  updateUrl,
} from '../../utils';
import usePaginatedLearnerTableData from '../../hooks/usePaginatedLearnerTableData';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';
import EmailCell from '../EmailCell';
import TableErrorAlert from '../TableErrorAlert';

const TABLE_ID = 'completed-learners';

const ERROR_HEADING = {
  id: 'admin.portal.completed.learners.error.heading',
  defaultMessage: 'Unable to load data',
  description: 'Heading shown when the completed learners table data fails to load',
};

const ERROR_MESSAGE = {
  id: 'admin.portal.completed.learners.error.message',
  defaultMessage: 'Try refreshing your screen.',
  description: 'Body message shown when the completed learners table data fails to load',
};

const CompletedLearnersTable = ({ enterpriseId }) => {
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const initialTableState = React.useMemo(
    () => getTableStateFromSearch(location.search, DEFAULT_TABLE_ORDERING),
    [location.search],
  );
  const [pageIndex, setPageIndex] = React.useState(initialTableState.pageIndex);
  const [ordering, setOrdering] = React.useState(initialTableState.ordering);

  const tableColumns = React.useMemo(() => [
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.completed.learners.table.user_email.column.heading',
        defaultMessage: 'Email',
        description: 'Column heading for the user email column in the completed learners table',
      }),
      accessor: 'user_email',
      Cell: EmailCell,
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.completed.learned.table.completed_courses.column.heading',
        defaultMessage: 'Total Course Completed Count',
        description: 'Column heading for the completed courses column in the completed learners table',
      }),
      accessor: 'completed_courses',
    },
  ], [intl]);

  React.useEffect(() => {
    const nextTableState = getTableStateFromSearch(location.search, DEFAULT_TABLE_ORDERING);
    setPageIndex(nextTableState.pageIndex);
    setOrdering(nextTableState.ordering);
  }, [location.search]);

  const {
    data,
    itemCount,
    pageCount,
    isLoading,
    error,
  } = usePaginatedLearnerTableData({
    enterpriseId,
    pageIndex,
    ordering,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
    fetchMethod: EnterpriseDataApiService.fetchCompletedLearners,
  });

  const fetchData = React.useCallback(({ pageIndex: nextPageIndex = 0, sortBy = [] } = {}) => {
    const latestSort = sortBy[sortBy.length - 1];
    if (latestSort?.id) {
      const nextOrdering = `${latestSort.desc ? '-' : ''}${latestSort.id}`;
      if (nextOrdering !== ordering) {
        setPageIndex(0);
        setOrdering(nextOrdering);

        updateUrl(navigate, location.pathname, {
          page: 1,
          ordering: nextOrdering,
        });

        sendEnterpriseTrackEvent(enterpriseId, 'edx.ui.enterprise.admin_portal.table.sorted', {
          tableId: TABLE_ID,
          column: latestSort.id,
          direction: latestSort?.desc ? 'desc' : 'asc',
        });
        return;
      }
    }

    if (nextPageIndex !== pageIndex) {
      setPageIndex(nextPageIndex);

      updateUrl(navigate, location.pathname, {
        page: nextPageIndex + 1,
      });

      sendEnterpriseTrackEvent(enterpriseId, 'edx.ui.enterprise.admin_portal.table.paginated', {
        tableId: TABLE_ID,
        page: nextPageIndex + 1,
      });
    }
  }, [enterpriseId, location.pathname, navigate, ordering, pageIndex]);

  if (error) {
    return <TableErrorAlert heading={ERROR_HEADING} message={ERROR_MESSAGE} />;
  }

  return (
    <DataTable
      key={`${enterpriseId}-${pageIndex}-${ordering || 'default'}`}
      className="completed-learners"
      isLoading={isLoading}
      isPaginated
      manualPagination
      isSortable
      manualSortBy
      initialState={{
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        pageIndex,
        sortBy: getSortStateFromOrdering(ordering, DEFAULT_TABLE_ORDERING),
      }}
      data={data}
      itemCount={itemCount}
      pageCount={pageCount}
      fetchData={fetchData}
      columns={tableColumns}
    >
      <DataTable.TableControlBar />
      <DataTable.Table />
      {!isLoading && (
        <DataTable.EmptyTable content={intl.formatMessage({
          id: 'admin.portal.completed.learners.empty.table',
          defaultMessage: 'There are no results.',
          description: 'Message shown when the completed learners table has no rows to display',
        })}
        />
      )}
      <DataTable.TableFooter />
    </DataTable>
  );
};

CompletedLearnersTable.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(CompletedLearnersTable);
