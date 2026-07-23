import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { Alert, DataTable } from '@openedx/paragon';
import { Error } from '@openedx/paragon/icons';

import {
  DEFAULT_TABLE_ORDERING,
  DEFAULT_TABLE_PAGE_SIZE,
  getSortStateFromOrdering,
  getTableStateFromSearch,
  i18nFormatTimestamp,
  updateUrl,
} from '../../utils';
import usePaginatedLearnerTableData from '../../hooks/usePaginatedLearnerTableData';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';
import EmailCell from '../EmailCell';

const TABLE_ID = 'enrolled-learners-inactive-courses';

const ErrorMessage = () => (
  <Alert variant="danger" icon={Error}>
    <Alert.Heading>
      <FormattedMessage
        id="admin.portal.enrolled.learners.inactive.courses.error.heading"
        defaultMessage="Unable to load data"
        description="Heading shown when enrolled learners for inactive courses table data fails to load"
      />
    </Alert.Heading>
    <p>
      <FormattedMessage
        id="admin.portal.enrolled.learners.inactive.courses.error.message"
        defaultMessage="Try refreshing your screen."
        description="Body message shown when enrolled learners for inactive courses table data fails to load"
      />
    </p>
  </Alert>
);

const EnrolledLearnersForInactiveCoursesTable = ({ enterpriseId }) => {
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
        id: 'admin.portal.lpr.enrolled.learners.inactive.courses.table.user_email.column.heading',
        defaultMessage: 'Email',
        description: 'Column heading for the user email column in the enrolled learners table for inactive courses',
      }),
      accessor: 'user_email',
      Cell: EmailCell,
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.inactive.courses.table.enrollment_count.column.heading',
        defaultMessage: 'Total Course Enrollment Count',
        description: 'Column heading for the course enrollment count column in the enrolled learners table for inactive courses',
      }),
      accessor: 'enrollment_count',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.inactive.courses.table.course_completion_count.column.heading',
        defaultMessage: 'Total Completed Courses Count',
        description: 'Column heading for the completed courses count column in the enrolled learners table for inactive courses',
      }),
      accessor: 'course_completion_count',
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.inactive.courses.table.last_activity_date.column.heading',
        defaultMessage: 'Last Activity Date',
        description: 'Column heading for the last activity date column in the enrolled learners table for inactive courses',
      }),
      accessor: 'last_activity_date',
      Cell: ({ value }) => i18nFormatTimestamp({
        intl,
        timestamp: value,
      }),
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
    fetchMethod: EnterpriseDataApiService.fetchEnrolledLearnersForInactiveCourses,
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

        const column = tableColumns.find(({ accessor }) => accessor === latestSort?.id);
        sendEnterpriseTrackEvent(enterpriseId, 'edx.ui.enterprise.admin_portal.table.sorted', {
          tableId: TABLE_ID,
          column: column?.Header,
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
  }, [enterpriseId, location.pathname, navigate, ordering, pageIndex, tableColumns]);

  if (error) {
    return <ErrorMessage />;
  }

  return (
    <DataTable
      key={`${enterpriseId}-${pageIndex}-${ordering || 'default'}`}
      className="enrolled-learners-inactive-courses"
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
      {!isLoading && !error && (
        <DataTable.EmptyTable content={intl.formatMessage({
          id: 'admin.portal.enrolled.learners.inactive.courses.empty.table',
          defaultMessage: 'There are no results.',
          description: 'Message shown when the enrolled learners for inactive courses table has no rows to display',
        })}
        />
      )}
      <DataTable.TableFooter />
    </DataTable>
  );
};

EnrolledLearnersForInactiveCoursesTable.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(EnrolledLearnersForInactiveCoursesTable);
