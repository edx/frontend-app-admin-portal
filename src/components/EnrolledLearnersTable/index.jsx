import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { sendEnterpriseTrackEvent } from '@2uinc/frontend-enterprise-utils';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
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
import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';
import EmailCell from '../EmailCell';

const TABLE_ID = 'enrolled-learners';

const renderErrorMessage = () => (
  <Alert variant="danger" icon={Error}>
    <Alert.Heading>
      <FormattedMessage
        id="admin.portal.enrolled.learners.error.heading"
        defaultMessage="Unable to load data"
        description="Heading shown when enrolled learners table data fails to load"
      />
    </Alert.Heading>
    <p>
      <FormattedMessage
        id="admin.portal.enrolled.learners.error.message"
        defaultMessage="Try refreshing your screen."
        description="Body message shown when enrolled learners table data fails to load"
      />
    </p>
  </Alert>
);

const EnrolledLearnersTable = ({ enterpriseId }) => {
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const initialTableState = React.useMemo(
    () => getTableStateFromSearch(location.search, DEFAULT_TABLE_ORDERING),
    [location.search],
  );
  const [data, setData] = React.useState([]);
  const [itemCount, setItemCount] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(1);
  const [pageIndex, setPageIndex] = React.useState(initialTableState.pageIndex);
  const [ordering, setOrdering] = React.useState(initialTableState.ordering);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const tableColumns = React.useMemo(() => [
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.table.user_email.column.heading',
        defaultMessage: 'Email',
        description: 'Column heading for the user email column in the enrolled learners table',
      }),
      accessor: 'user_email',
      Cell: EmailCell,
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.table.lms_user_created.column.heading',
        defaultMessage: 'Account Created',
        description: 'Column heading for the lms user created column in the enrolled learners table',
      }),
      accessor: 'lms_user_created',
      Cell: ({ value }) => i18nFormatTimestamp({
        intl,
        timestamp: value,
      }),
    },
    {
      Header: intl.formatMessage({
        id: 'admin.portal.lpr.enrolled.learners.table.enrollment_count.column.heading',
        defaultMessage: 'Total Course Enrollment Count',
        description: 'Column heading for the course enrollment count column in the enrolled learners table',
      }),
      accessor: 'enrollment_count',
    },
  ], [intl]);

  React.useEffect(() => {
    const nextTableState = getTableStateFromSearch(location.search, DEFAULT_TABLE_ORDERING);

    if (nextTableState.pageIndex !== pageIndex) {
      setPageIndex(nextTableState.pageIndex);
    }

    if (nextTableState.ordering !== ordering) {
      setOrdering(nextTableState.ordering);
    }
  }, [location.search, ordering, pageIndex]);

  React.useEffect(() => {
    let isCurrent = true;

    const options = {
      page: pageIndex + 1,
      page_size: DEFAULT_TABLE_PAGE_SIZE,
    };

    if (ordering) {
      options.ordering = ordering;
    }

    setIsLoading(true);
    setError(null);

    EnterpriseDataApiService.fetchEnrolledLearners(enterpriseId, options)
      .then((response) => {
        if (!isCurrent) {
          return;
        }

        const responseData = response?.data || {};
        const results = responseData.results || [];

        setData(results);
        setItemCount(responseData.count ?? results.length);
        setPageCount(responseData.num_pages || 1);
      })
      .catch((err) => {
        if (!isCurrent) {
          return;
        }

        logError(err);
        setError(err);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [enterpriseId, ordering, pageIndex]);

  const fetchData = React.useCallback(({ pageIndex: nextPageIndex = 0, sortBy = [] } = {}) => {
    const latestSort = sortBy[sortBy.length - 1];
    if (latestSort?.id) {
      const nextOrdering = `${latestSort.desc ? '-' : ''}${latestSort.id}`;
      // Only treat this as a sort change when ordering actually changes.
      // DataTable often includes current sortBy while paginating.
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
    return renderErrorMessage();
  }

  return (
    <DataTable
      key={`${enterpriseId}-${pageIndex}-${ordering || 'default'}`}
      className="enrolled-learners"
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
          id: 'admin.portal.enrolled.learners.empty.table',
          defaultMessage: 'There are no results.',
          description: 'Message shown when the enrolled learners table has no rows to display',
        })}
        />
      )}
      <DataTable.TableFooter />
    </DataTable>
  );
};

EnrolledLearnersTable.propTypes = {
  enterpriseId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  enterpriseId: state.portalConfiguration.enterpriseId,
});

export default connect(mapStateToProps)(EnrolledLearnersTable);
