import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { getConfig } from '@edx/frontend-platform/config';
import { Alert, DataTable } from '@openedx/paragon';
import { Error } from '@openedx/paragon/icons';

import {
  DEFAULT_TABLE_PAGE_SIZE,
  FILTER_QUERY_PARAMS,
  formatPercentage,
  getFilteredQueryParams,
  getSortStateFromOrdering,
  getTableStateFromSearch,
  i18nFormatTimestamp,
  isEnterpriseCustomerInUuidAllowlist,
  updateUrl,
} from '../../utils';
import usePaginatedLearnerTableData from '../../hooks/usePaginatedLearnerTableData';
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';
import EmailCell from '../EmailCell';

const TABLE_ID = 'enrollments';
// Preserves the pre-migration default sort (current grade, descending).
const DEFAULT_ORDERING = '-current_grade';

const renderErrorMessage = () => (
  <Alert variant="danger" icon={Error}>
    <Alert.Heading>
      <FormattedMessage
        id="admin.portal.lpr.enrollments.error.heading"
        defaultMessage="Unable to load data"
        description="Heading shown when the enrollments table data fails to load"
      />
    </Alert.Heading>
    <p>
      <FormattedMessage
        id="admin.portal.lpr.enrollments.error.message"
        defaultMessage="Try refreshing your screen."
        description="Body message shown when the enrollments table data fails to load"
      />
    </p>
  </Alert>
);

const EnrollmentsTable = ({ enterpriseId }) => {
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const initialTableState = React.useMemo(
    () => getTableStateFromSearch(location.search, DEFAULT_ORDERING),
    [location.search],
  );
  const [pageIndex, setPageIndex] = React.useState(initialTableState.pageIndex);
  const [ordering, setOrdering] = React.useState(initialTableState.ordering);

  const filterOptions = React.useMemo(
    () => getFilteredQueryParams(location.search, FILTER_QUERY_PARAMS),
    [location.search],
  );

  const tableColumns = React.useMemo(() => [
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.user_email',
        defaultMessage: 'Email',
      }),
      accessor: 'user_email',
      Cell: EmailCell,
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.user_first_name',
        defaultMessage: 'First Name',
        description: 'Title for the first name column in the enrollments table',
      }),
      accessor: 'user_first_name',
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.user_last_name',
        defaultMessage: 'Last Name',
        description: 'Title for the last name column in the enrollments table',
      }),
      accessor: 'user_last_name',
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.courseTitle',
        defaultMessage: 'Course Title',
      }),
      accessor: 'course_title',
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.courseListPrice',
        defaultMessage: 'Course Price',
      }),
      accessor: 'course_list_price',
      Cell: ({ value }) => (value ? `$${value}` : ''),
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.courseStartDate',
        defaultMessage: 'Start Date',
      }),
      accessor: 'course_start_date',
      Cell: ({ value }) => i18nFormatTimestamp({ intl, timestamp: value }),
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.courseEndDate',
        defaultMessage: 'End Date',
      }),
      accessor: 'course_end_date',
      Cell: ({ value }) => i18nFormatTimestamp({ intl, timestamp: value }),
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.courseProgress',
        defaultMessage: 'Course Progress',
      }),
      accessor: 'course_progress',
      Cell: ({ value }) => formatPercentage({ decimal: value }),
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.coursePassingGrade',
        defaultMessage: 'Course Passing Grade',
      }),
      accessor: 'course_passing_grade',
      Cell: ({ value }) => formatPercentage({ decimal: value }),
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.currentGrade',
        defaultMessage: 'Current Grade',
      }),
      accessor: 'current_grade',
      Cell: ({ value }) => formatPercentage({ decimal: value }),
    },
    {
      Header: intl.formatMessage({
        id: 'adminPortal.enrollmentsTable.lastActivityDate',
        defaultMessage: 'Last Activity Date',
      }),
      accessor: 'last_activity_date',
      Cell: ({ value }) => i18nFormatTimestamp({ intl, timestamp: value }),
    },
  ], [intl]);

  const visibleTableColumns = React.useMemo(() => {
    const disabledFor = getConfig().DISABLE_COURSE_PROGRESS_COLUMN_FOR_ENTERPRISE_CUSTOMER;
    if (isEnterpriseCustomerInUuidAllowlist(enterpriseId, disabledFor)) {
      return tableColumns.filter(({ accessor }) => accessor !== 'course_progress');
    }
    return tableColumns;
  }, [tableColumns, enterpriseId]);

  React.useEffect(() => {
    const nextTableState = getTableStateFromSearch(location.search, DEFAULT_ORDERING);
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
    fetchMethod: EnterpriseDataApiService.fetchCourseEnrollments,
    extraOptions: filterOptions,
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

  const emptyTableMessage = React.useMemo(() => {
    const query = new URLSearchParams(location.search);
    if (query.has('group_uuid')) {
      return intl.formatMessage({
        id: 'admin.portal.lpr.learner.activity.table.empty.groups.message',
        defaultMessage: 'We are currently processing the latest updates. The data is refreshed twice a day. Thank you for your patience, and please check back soon.',
        description: 'Empty table message when groups data is pending.',
      });
    }
    return intl.formatMessage({
      id: 'admin.portal.lpr.enrollments.table.empty.message',
      defaultMessage: 'There are no results.',
      description: 'Default empty table message for the enrollments table.',
    });
  }, [intl, location.search]);

  if (error) {
    return renderErrorMessage();
  }

  return (
    <DataTable
      key={`${enterpriseId}-${pageIndex}-${ordering || 'default'}`}
      className="enrollments"
      isLoading={isLoading}
      isPaginated
      manualPagination
      isSortable
      manualSortBy
      initialState={{
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
        pageIndex,
        sortBy: getSortStateFromOrdering(ordering, DEFAULT_ORDERING),
      }}
      data={data}
      itemCount={itemCount}
      pageCount={pageCount}
      fetchData={fetchData}
      columns={visibleTableColumns}
    >
      <DataTable.TableControlBar />
      <DataTable.Table />
      {!isLoading && (
        <DataTable.EmptyTable content={emptyTableMessage} />
      )}
      <DataTable.TableFooter />
    </DataTable>
  );
};

EnrollmentsTable.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(EnrollmentsTable);
